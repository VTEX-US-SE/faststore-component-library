import { Command } from 'commander'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

interface AddResolverOptions {
  targetDir: string
  clientDir: string
  namespace: string
  force: boolean
}

interface OperationMeta {
  /** The GraphQL root/type this operation attaches to, e.g. "Query", "Mutation", or a type
   *  name like "StoreProduct" when `resolverShape` is "map". Used as a resolver-map key, so
   *  any string GraphQL accepts as a type name works here. */
  operationType: string
  fieldName: string
  factoryExport: string
  configParams: string[]
  clientQueryExport: string
  clientFileName: string
  clientConstantName: string
  /**
   * "field" (default): the factory returns a single resolver function for one
   * `operationType.fieldName`, and this CLI wraps it in `{ [operationType]: { [fieldName]:
   * factory(...) } }`.
   * "map": the factory already returns the full resolver map (it may span several types,
   * e.g. a field extension on an existing type plus a root Mutation) -- this CLI writes
   * `export default factory(...)` as-is, unwrapped.
   */
  resolverShape?: 'field' | 'map'
  /**
   * For "map"-shaped resolvers only: which top-level keys of the returned map extend an
   * *existing* FastStore/VTEX type (e.g. "StoreProduct") using data already available in the
   * resolver context -- FastStore's own convention calls this a "vtex" extension, kept apart
   * from "thirdParty" extensions (new types/queries/mutations, calling an external API). When
   * present, `add-resolver` writes two resolver files instead of one -- `vtex/resolvers/` gets
   * these keys, `thirdParty/resolvers/` gets everything else -- ignoring --namespace for
   * resolver placement (that split is fixed by FastStore's own convention, not renameable per
   * project). --namespace still controls where the typeDef itself is copied.
   */
  typeExtensionKeys?: string[]
}

export const addResolverCommand = new Command('add-resolver')
  .description(
    'Copies a @vtex-us-se/resolvers operation (typeDef + client query) into the consuming project, ' +
      'and scaffolds (or safely merges into) the server resolver index and client query wrapper.',
  )
  .argument('<operationName>', 'Name of the GraphQL operation to add (must exist in @vtex-us-se/resolvers)')
  .option('-t, --target-dir <path>', "Consuming project's src/graphql/ folder", 'src/graphql')
  .option('-c, --client-dir <path>', "Consuming project's client query folder", 'src/utils')
  .option('-n, --namespace <name>', 'GraphQL extension namespace to write the typeDef under', 'b2c')
  .option('-f, --force', 'overwrite the typeDef file if it already exists (never overwrites scaffolded resolver/client files)', false)
  .action((operationName: string, options: AddResolverOptions) => {
    try {
      addResolver(operationName, options)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  })

/**
 * Same two-probe-level convention as findSchemaPath() in add.ts (direct, or one segment down),
 * generalized over the file extension since here we look for both .graphql and .meta.json.
 * Also returns which segment folder (e.g. "b2c") the asset was found under, if any — that
 * segment is the package's real export subpath, which is NOT necessarily the same string as
 * the consuming project's own --namespace option (see resolveOperationAssets).
 */
function findAssetPath(
  distRoot: string,
  operationName: string,
  extension: string,
): { path: string; segment?: string } | undefined {
  const direct = join(distRoot, operationName, `${operationName}${extension}`)
  if (existsSync(direct)) return { path: direct }

  for (const entry of readdirSync(distRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const nested = join(distRoot, entry.name, operationName, `${operationName}${extension}`)
    if (existsSync(nested)) return { path: nested, segment: entry.name }
  }

  return undefined
}

/**
 * Resolves the .graphql and .meta.json for <operationName> from whichever @vtex-us-se/resolvers
 * is installed in the CONSUMING project (resolved from cwd, not from this CLI's own node_modules),
 * plus the package's real export subpath for that operation (e.g. "b2c", from
 * `@vtex-us-se/resolvers/b2c`) — derived from where the operation actually lives under `dist/`,
 * not from the consumer's own --namespace option. Those are unrelated: --namespace only controls
 * the folder structure this command writes into the CONSUMING project (e.g. `src/graphql/vtex/`
 * vs `src/graphql/thirdParty/`), while the package subpath is fixed by how @vtex-us-se/resolvers
 * itself is organized and packaged. Using --namespace for the import path was a real bug here
 * (e.g. `--namespace thirdParty` used to generate `from '@vtex-us-se/resolvers/thirdParty'`, a
 * subpath the package's `exports` map never declared) — this only trusts the package's own
 * layout.
 */
function resolveOperationAssets(operationName: string): { graphqlPath: string; metaPath: string; packageSubpath: string } {
  let resolversPackageJsonPath: string
  try {
    resolversPackageJsonPath = require.resolve('@vtex-us-se/resolvers/package.json', {
      paths: [process.cwd()],
    })
  } catch {
    throw new Error('@vtex-us-se/resolvers is not installed in this project. Run `pnpm add @vtex-us-se/resolvers` first.')
  }

  const distRoot = join(dirname(resolversPackageJsonPath), 'dist')
  const graphql = findAssetPath(distRoot, operationName, '.graphql')
  const meta = findAssetPath(distRoot, operationName, '.meta.json')

  if (!graphql || !meta) {
    throw new Error(
      `No operation found for "${operationName}" under ${distRoot}. Check the operation name — it must match ` +
        'the operation folder name under @vtex-us-se/resolvers/src exactly (case-sensitive).',
    )
  }

  if (!graphql.segment || graphql.segment !== meta.segment) {
    throw new Error(
      `Could not determine @vtex-us-se/resolvers' export subpath for "${operationName}" ` +
        `(found its .graphql and .meta.json under inconsistent or top-level-only paths in ${distRoot}). ` +
        'This operation may be packaged incorrectly.',
    )
  }

  return { graphqlPath: graphql.path, metaPath: meta.path, packageSubpath: graphql.segment }
}

/**
 * Requires `@vtex-us-se/resolvers/<packageSubpath>` from the CONSUMING project (from cwd) and
 * returns one named export's runtime value, asserting it's a string. Used to embed a
 * query/mutation's actual text literally into a generated file, rather than importing the
 * constant: this project's own GraphQL codegen only registers `gql(\`...\`)` calls whose
 * argument is literal text inside its own src/ -- a `gql(IMPORTED_CONST)` call can never be
 * seen by it, no matter that the import itself resolves fine at runtime.
 */
function resolveStringExport(packageSubpath: string, exportName: string): string {
  const modulePath = require.resolve(`@vtex-us-se/resolvers/${packageSubpath}`, { paths: [process.cwd()] })
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(modulePath)
  const value = mod[exportName]

  if (typeof value !== 'string') {
    throw new Error(`Expected @vtex-us-se/resolvers/${packageSubpath}'s "${exportName}" export to be a string, got ${typeof value}.`)
  }

  return value
}

function escapeForTemplateLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}

/**
 * Best-effort read of the consuming project's own discovery.config.js (assumed at cwd, same
 * convention already relied on by --target-dir's default). Never throws — a missing file or
 * missing api.storeId just means the generated snippet falls back to a placeholder.
 */
function detectVtexApiConfig(): { storeId?: string; environment?: string } {
  try {
    const discoveryConfigPath = join(process.cwd(), 'discovery.config.js')
    if (!existsSync(discoveryConfigPath)) return {}

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(discoveryConfigPath)
    const api = config?.api ?? {}
    return {
      storeId: typeof api.storeId === 'string' ? api.storeId : undefined,
      environment: typeof api.environment === 'string' ? api.environment : undefined,
    }
  } catch {
    return {}
  }
}

/**
 * Renders one config line per entry in `meta.configParams` (a `?` suffix marks it optional),
 * joined at `indent`. `storeId`/`environment` are auto-detected from the consuming project's
 * own discovery.config.js when present; any other declared param (e.g. `checkoutBaseUrl`) has
 * no such source, so it's surfaced as a commented-out suggestion instead of silently omitted —
 * a param a factory declares but this snippet never mentions is easy to miss entirely.
 */
function buildConfigLines(meta: OperationMeta, vtexConfig: { storeId?: string; environment?: string }, indent: string): string {
  const lines = meta.configParams
    .map((param) => {
      const optional = param.endsWith('?')
      const name = optional ? param.slice(0, -1) : param

      if (name === 'storeId') {
        return vtexConfig.storeId
          ? `storeId: '${vtexConfig.storeId}',`
          : `storeId: 'YOUR_STORE_ID', // TODO: replace with your VTEX account id (see discovery.config.js -> api.storeId)`
      }

      if (name === 'environment') {
        return vtexConfig.environment ? `environment: '${vtexConfig.environment}',` : undefined
      }

      if (name === 'checkoutBaseUrl') {
        return (
          `// checkoutBaseUrl: 'https://your-store-domain.com', // optional -- defaults to calling the VTEX\n${indent}` +
          '// platform host directly. Set this if your project proxies /api/checkout/* through its own domain.'
        )
      }

      return `// ${name}: 'TODO', // ${optional ? 'optional' : 'required'} config param -- see @vtex-us-se/resolvers' source for what this does`
    })
    .filter((line): line is string => line !== undefined)

  return lines.join(`\n${indent}`)
}

function buildResolverSnippet(
  meta: OperationMeta,
  packageSubpath: string,
  vtexConfig: { storeId?: string; environment?: string },
): string {
  if (meta.resolverShape === 'map') {
    return `import { ${meta.factoryExport} } from '@vtex-us-se/resolvers/${packageSubpath}'

export default ${meta.factoryExport}({
  ${buildConfigLines(meta, vtexConfig, '  ')}
})
`
  }

  const resolverVarName = meta.operationType === 'Mutation' ? 'mutationResolver' : 'queryResolver'

  return `import { ${meta.factoryExport} } from '@vtex-us-se/resolvers/${packageSubpath}'

const ${resolverVarName} = {
  ${meta.operationType}: {
    ${meta.fieldName}: ${meta.factoryExport}({
      ${buildConfigLines(meta, vtexConfig, '      ')}
    }),
  },
}

export default ${resolverVarName}
`
}

/** Same factory call as buildResolverSnippet's "map" branch, but only re-exporting `keys` of
 *  the returned map — used to split a map-shaped resolver across vtex/ and thirdParty/. */
function buildSplitResolverSnippet(
  operationName: string,
  meta: OperationMeta,
  packageSubpath: string,
  vtexConfig: { storeId?: string; environment?: string },
  keys: string[],
): string {
  const keyLines = keys.map((key) => `  ${key}: ${operationName}.${key},`).join('\n')

  return `import { ${meta.factoryExport} } from '@vtex-us-se/resolvers/${packageSubpath}'

const ${operationName} = ${meta.factoryExport}({
  ${buildConfigLines(meta, vtexConfig, '  ')}
})

export default {
${keyLines}
}
`
}

function buildClientWrapperSnippet(meta: OperationMeta, packageSubpath: string, operationName: string): string {
  const queryText = escapeForTemplateLiteral(resolveStringExport(packageSubpath, meta.clientQueryExport))

  return `import { gql } from '@faststore/core/api'

// Embedded literally, not imported from @vtex-us-se/resolvers: this project's GraphQL codegen
// only registers a gql() call whose argument is literal template-string text inside its own
// src/, so an imported constant is invisible to it even though the import itself resolves fine
// at runtime. Re-run "se-components add-resolver ${operationName}" after a @vtex-us-se/resolvers
// upgrade that changes this operation -- it never overwrites an existing copy of this file.
export const ${meta.clientConstantName} = gql(\`${queryText}\`)
`
}

/**
 * Creates `aggregatorPath` if missing (a plain re-export of `resolverModuleName`), or safely
 * merges into it if it already holds either shape this CLI itself produces: a single re-export,
 * or an already-merged `{ ...a, ...b }` spread object. Anything else is left untouched with
 * instructions printed instead — silently mis-merging a consumer's own file is worse than
 * asking them to add a few lines by hand.
 */
function writeOrMergeAggregator(aggregatorPath: string, resolverModuleName: string): string {
  if (!existsSync(aggregatorPath)) {
    mkdirSync(dirname(aggregatorPath), { recursive: true })
    writeFileSync(aggregatorPath, `export { default } from './${resolverModuleName}'\n`)
    return `✔ Created ${aggregatorPath} (re-exports ./${resolverModuleName})`
  }

  const content = readFileSync(aggregatorPath, 'utf-8')

  if (content.includes(`./${resolverModuleName}'`) || content.includes(`./${resolverModuleName}"`)) {
    return `ℹ ${aggregatorPath} already references ./${resolverModuleName} — left untouched.`
  }

  const singleReExportMatch = content.trim().match(/^export\s*\{\s*default\s*\}\s*from\s*(['"])(\.\/[A-Za-z0-9_-]+)\1;?$/)
  if (singleReExportMatch) {
    const existingModule = singleReExportMatch[2] as string
    const existingVar = existingModule.replace(/^\.\//, '')
    const merged =
      `import ${existingVar} from '${existingModule}'\n` +
      `import ${resolverModuleName} from './${resolverModuleName}'\n\n` +
      `export default {\n  ...${existingVar},\n  ...${resolverModuleName},\n}\n`
    writeFileSync(aggregatorPath, merged)
    return `✔ Merged ${aggregatorPath} into a combined export (added ./${resolverModuleName})`
  }

  const spreadShapeMatch = content.match(
    /^((?:import\s+[A-Za-z0-9_$]+\s+from\s+(['"])\.\/[A-Za-z0-9_-]+\2\s*\n)+)\s*export default\s*\{\s*((?:\.\.\.[A-Za-z0-9_$]+,?\s*)+)\}\s*;?\s*$/,
  )
  if (spreadShapeMatch) {
    const importsBlock = spreadShapeMatch[1] as string
    const spreadsBlock = (spreadShapeMatch[3] as string).trim()
    const merged =
      `${importsBlock}import ${resolverModuleName} from './${resolverModuleName}'\n\n` +
      `export default {\n  ${spreadsBlock}${spreadsBlock.endsWith(',') ? '' : ','}\n  ...${resolverModuleName},\n}\n`
    writeFileSync(aggregatorPath, merged)
    return `✔ Merged ${aggregatorPath} into its existing combined export (added ./${resolverModuleName})`
  }

  return (
    `⚠ ${aggregatorPath} already exists in a shape this CLI won't risk merging automatically — add this by hand: ` +
    `import ${resolverModuleName} from './${resolverModuleName}', then spread ...${resolverModuleName} into its default export.`
  )
}

function addResolver(operationName: string, options: AddResolverOptions): void {
  const { targetDir, clientDir, namespace, force } = options
  const { graphqlPath, metaPath, packageSubpath } = resolveOperationAssets(operationName)
  const meta: OperationMeta = JSON.parse(readFileSync(metaPath, 'utf-8'))

  const summary: string[] = []

  // 1. typeDef
  const typeDefsDir = join(targetDir, namespace, 'typeDefs')
  const typeDefDest = join(typeDefsDir, `${operationName}.graphql`)
  if (existsSync(typeDefDest) && !force) {
    throw new Error(`${typeDefDest} already exists. Pass --force to overwrite it (discards any manual edits).`)
  }
  mkdirSync(typeDefsDir, { recursive: true })
  copyFileSync(graphqlPath, typeDefDest)
  summary.push(`✔ Copied typeDef → ${typeDefDest}`)

  // 2. server resolver(s)
  const vtexConfig = detectVtexApiConfig()
  const resolverFileName = `${operationName}Resolver.ts`
  const resolverModuleName = operationName

  if (meta.resolverShape === 'map' && meta.typeExtensionKeys && meta.typeExtensionKeys.length > 0) {
    // Split across FastStore's two fixed namespaces (see FastStore's own extending-GraphQL
    // convention) -- not driven by --namespace, since these two folder names aren't a per-
    // project choice.
    const vtexKeys = meta.typeExtensionKeys
    // Every other key this factory's map actually has is a "thirdParty" key. We don't have the
    // full key list without calling the factory, so probe it once here (side-effect free) --
    // silencing its own runtime warnings (e.g. missing checkoutBaseUrl) since a placeholder
    // probe call isn't the moment to surface those.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const factoryModule = require(require.resolve(`@vtex-us-se/resolvers/${packageSubpath}`, { paths: [process.cwd()] }))
    const originalWarn = console.warn
    console.warn = () => {}
    let probe: Record<string, unknown>
    try {
      probe = factoryModule[meta.factoryExport]({ storeId: 'probe' })
    } finally {
      console.warn = originalWarn
    }
    const thirdPartyKeys = Object.keys(probe).filter((key) => !vtexKeys.includes(key))

    const placements: Array<{ ns: string; keys: string[] }> = [
      { ns: 'vtex', keys: vtexKeys },
      { ns: 'thirdParty', keys: thirdPartyKeys },
    ].filter((placement) => placement.keys.length > 0)

    for (const { ns, keys } of placements) {
      const resolverPath = join(targetDir, ns, 'resolvers', resolverFileName)
      const snippet = buildSplitResolverSnippet(operationName, meta, packageSubpath, vtexConfig, keys)

      if (existsSync(resolverPath)) {
        summary.push(`⚠ ${resolverPath} already exists — not touched.`)
      } else {
        mkdirSync(dirname(resolverPath), { recursive: true })
        writeFileSync(resolverPath, snippet)
        summary.push(`✔ Created ${resolverPath} (${keys.join(', ')})`)
      }

      const aggregatorPath = join(targetDir, ns, 'resolvers', 'index.ts')
      summary.push(writeOrMergeAggregator(aggregatorPath, resolverModuleName))
    }
  } else {
    const resolverPath = join(targetDir, namespace, 'resolvers', resolverFileName)
    const resolverSnippet = buildResolverSnippet(meta, packageSubpath, vtexConfig)

    if (existsSync(resolverPath)) {
      const note =
        meta.resolverShape === 'map'
          ? `⚠ ${resolverPath} already exists — not touched.`
          : `⚠ ${resolverPath} already exists — not touched. Add this to its "${meta.operationType}" object by hand:\n\n${resolverSnippet}`
      summary.push(note)
    } else {
      mkdirSync(dirname(resolverPath), { recursive: true })
      writeFileSync(resolverPath, resolverSnippet)
      const storeIdNote = vtexConfig.storeId ? ` (storeId auto-detected: ${vtexConfig.storeId})` : ' (storeId left as a TODO placeholder)'
      summary.push(`✔ Created ${resolverPath}${storeIdNote}`)
    }

    if (meta.resolverShape === 'map') {
      summary.push(
        `ℹ ${resolverFileName} exports a full resolver map (it may cover more than "${meta.operationType}.${meta.fieldName}" — ` +
          'declare typeExtensionKeys in this operation\'s meta.json to have this command split it across vtex/ and thirdParty/ automatically).',
      )
    }

    const aggregatorPath = join(targetDir, namespace, 'resolvers', 'index.ts')
    summary.push(writeOrMergeAggregator(aggregatorPath, resolverModuleName))
  }

  // 3. client query wrapper (create only if missing, never overwrite)
  const clientPath = join(clientDir, meta.clientFileName)

  if (existsSync(clientPath)) {
    summary.push(`⚠ ${clientPath} already exists — not touched.`)
  } else {
    mkdirSync(dirname(clientPath), { recursive: true })
    writeFileSync(clientPath, buildClientWrapperSnippet(meta, packageSubpath, operationName))
    summary.push(`✔ Created ${clientPath}`)
  }

  console.log(summary.join('\n'))
  console.log(
    '\nNext steps (not automated by this CLI):\n' +
      '1. Set FS_DISCOVERY_APP_KEY / FS_DISCOVERY_APP_TOKEN in WebOps Settings (production) or vtex.env ' +
      '(local — never commit real values), if this operation needs them.\n' +
      `2. Import ${meta.clientConstantName} from ${clientPath} in whatever component calls this operation.\n` +
      '3. Run `faststore dev` / `faststore build` once so FastStore\'s own codegen generates the TS types for this operation.',
  )
}
