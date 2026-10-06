import { Command } from 'commander'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { findOperationDefinitions, operationNames } from '../lib/operations'

interface AddResolverOptions {
  targetDir: string
  clientDir: string
  namespace?: string
  force: boolean
}

/** The only two `src/graphql/<folder>/` names FastStore's GraphQL server actually loads. */
const FASTSTORE_NAMESPACES = ['vtex', 'thirdParty']

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
  /**
   * For non-split operations: which FastStore namespace folder ("vtex" or "thirdParty") the
   * typeDef and resolver belong in. Used when --namespace isn't passed; defaults to
   * "thirdParty" (new root operations calling an external API -- the common case).
   */
  namespace?: string
}

export const addResolverCommand = new Command('add-resolver')
  .description(
    'Copies a @vtex-us-se/resolvers operation (typeDef + client query) into the consuming project, ' +
      'and scaffolds (or safely merges into) the server resolver index and client query wrapper.',
  )
  .argument('<operationName>', 'Name of the GraphQL operation to add (must exist in @vtex-us-se/resolvers)')
  .option('-t, --target-dir <path>', "Consuming project's src/graphql/ folder", 'src/graphql')
  .option('-c, --client-dir <path>', "Consuming project's client query folder", 'src/utils')
  .option(
    '-n, --namespace <name>',
    'FastStore GraphQL namespace folder for a non-split operation ("vtex" or "thirdParty"). Defaults to the ' +
      "operation's own meta.json namespace, else thirdParty. Ignored for split operations (typeExtensionKeys).",
  )
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
 * Renders a resolvers/index.ts that combines `moduleNames` (each a default-exported resolver map
 * sitting next to it) per GraphQL type. Not a plain `{ ...a, ...b }` spread -- that's what this
 * CLI used to write, and two operations adding fields to the same type (e.g. both to `Mutation`)
 * then silently lost all but the last one's fields: no build or boot error, only a failure the
 * first time the dropped field is actually queried.
 */
function renderAggregator(moduleNames: string[]): string {
  const imports = moduleNames.map((name) => `import ${name} from './${name}'`).join('\n')
  const entries = moduleNames.map((name) => `  ${name},`).join('\n')

  return `${imports}

// Generated by se-components add-resolver. Merged per GraphQL type, not with an object spread:
// two operations can add fields to the same type (e.g. both to Mutation), and a spread would
// keep only the last one's. Add your own resolver maps to this list rather than spreading them.
const resolverMaps: Array<Record<string, Record<string, unknown>>> = [
${entries}
]

const resolvers: Record<string, Record<string, unknown>> = {}

for (const map of resolverMaps) {
  for (const [typeName, fields] of Object.entries(map)) {
    resolvers[typeName] = { ...resolvers[typeName], ...fields }
  }
}

export default resolvers
`
}

/**
 * The module names an existing aggregator combines, if it's in a shape this CLI itself writes
 * (current per-type merge, or either older shape: a single re-export, or a `{ ...a, ...b }`
 * spread). `undefined` for anything else -- a consumer's own file isn't rewritten blindly.
 */
function parseAggregatorModules(content: string): string[] | undefined {
  const singleReExport = content.trim().match(/^export\s*\{\s*default\s*\}\s*from\s*(['"])\.\/([A-Za-z0-9_-]+)\1;?$/)
  if (singleReExport) return [singleReExport[2] as string]

  const importNames = [...content.matchAll(/^import\s+([A-Za-z0-9_$]+)\s+from\s+(['"])\.\/([A-Za-z0-9_-]+)\2\s*;?\s*$/gm)]
    .filter((match) => match[1] === match[3])
    .map((match) => match[1] as string)
  if (importNames.length === 0) return undefined

  const spreadShape = content.match(
    /^((?:import\s+[A-Za-z0-9_$]+\s+from\s+(['"])\.\/[A-Za-z0-9_-]+\2\s*\n)+)\s*export default\s*\{\s*((?:\.\.\.[A-Za-z0-9_$]+,?\s*)+)\}\s*;?\s*$/,
  )
  if (spreadShape) return importNames

  if (content.trim() === renderAggregator(importNames).trim()) return importNames

  return undefined
}

/**
 * Creates `aggregatorPath` if missing, or adds `resolverModuleName` to it if it's in a shape
 * this CLI recognizes (see parseAggregatorModules) -- rewriting an older spread-shaped file into
 * the per-type merge on the way. Anything else is left untouched with instructions printed
 * instead: silently mis-merging a consumer's own file is worse than asking for a few lines by hand.
 */
function writeOrMergeAggregator(aggregatorPath: string, resolverModuleName: string): string {
  if (!existsSync(aggregatorPath)) {
    mkdirSync(dirname(aggregatorPath), { recursive: true })
    writeFileSync(aggregatorPath, renderAggregator([resolverModuleName]))
    return `✔ Created ${aggregatorPath} (combines ./${resolverModuleName})`
  }

  const content = readFileSync(aggregatorPath, 'utf-8')
  const existing = parseAggregatorModules(content)

  if (existing?.includes(resolverModuleName)) {
    return `ℹ ${aggregatorPath} already references ./${resolverModuleName} — left untouched.`
  }

  if (!existing) {
    if (content.includes(`./${resolverModuleName}'`) || content.includes(`./${resolverModuleName}"`)) {
      return `ℹ ${aggregatorPath} already references ./${resolverModuleName} — left untouched.`
    }
    return (
      `⚠ ${aggregatorPath} already exists in a shape this CLI won't risk merging automatically — add this by hand: ` +
      `import ${resolverModuleName} from './${resolverModuleName}', then merge its fields into your default export ` +
      'PER TYPE (a top-level object spread drops fields when two maps share a type such as Mutation).'
    )
  }

  const wasPerTypeMerge = content.trim() === renderAggregator(existing).trim()
  writeFileSync(aggregatorPath, renderAggregator([...existing, resolverModuleName]))
  return wasPerTypeMerge
    ? `✔ Added ./${resolverModuleName} to ${aggregatorPath}`
    : `✔ Added ./${resolverModuleName} to ${aggregatorPath} (rewrote it to merge per GraphQL type — its previous ` +
        'shape would have dropped fields shared by two operations)'
}

function addResolver(operationName: string, options: AddResolverOptions): void {
  const { targetDir, clientDir, force } = options
  const { graphqlPath, metaPath, packageSubpath } = resolveOperationAssets(operationName)
  const meta: OperationMeta = JSON.parse(readFileSync(metaPath, 'utf-8'))

  const summary: string[] = []
  // FastStore only ever loads src/graphql/vtex/ and src/graphql/thirdParty/ -- the old default
  // here ("b2c") put a non-split operation's typeDef and resolver in a folder nothing reads.
  const namespace = options.namespace ?? meta.namespace ?? 'thirdParty'
  if (!FASTSTORE_NAMESPACES.includes(namespace)) {
    summary.push(
      `⚠ Namespace "${namespace}" isn't one FastStore loads (only ${FASTSTORE_NAMESPACES.join(' / ')}) — this ` +
        "operation's typeDef and resolver will be ignored by the GraphQL server unless you move them.",
    )
  }
  const isSplitOperation = meta.resolverShape === 'map' && !!meta.typeExtensionKeys && meta.typeExtensionKeys.length > 0

  // 1. typeDef. A split operation's resolver is hardcoded into vtex/ + thirdParty/ (below) --
  // not driven by --namespace, since FastStore only ever scans those two exact folder names for
  // custom GraphQL, not an arbitrary --namespace value. The typeDef has to land in one of the
  // SAME two folders for the same reason, or the schema this project's GraphQL server actually
  // loads never gains the field/type the resolver map is prepared to answer -- which surfaces at
  // runtime as "X defined in resolvers, but not in schema", not a parse error, so it's easy to
  // miss until something actually queries the field. One copy is enough even though the
  // typeDef's content spans both namespaces conceptually (a StoreProduct extension + a new
  // Mutation/types): GraphQL doesn't care which file a definition's text lives in, only that
  // it's loaded exactly once -- copying the same file under both folders would instead register
  // every type in it twice and fail to build the schema at all.
  const typeDefNamespace = isSplitOperation ? 'thirdParty' : namespace
  const typeDefsDir = join(targetDir, typeDefNamespace, 'typeDefs')
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
  const resolverModuleName = resolverFileName.replace(/\.ts$/, '')

  if (isSplitOperation) {
    // Split across FastStore's two fixed namespaces (see FastStore's own extending-GraphQL
    // convention) -- not driven by --namespace, since these two folder names aren't a per-
    // project choice.
    // Non-null: `isSplitOperation` already established meta.typeExtensionKeys is a non-empty array.
    const vtexKeys = meta.typeExtensionKeys as string[]
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

  // 3. client query wrapper (create only if missing, never overwrite) -- and not at all when
  // this project's src/ already defines the operation (typically a component copied by
  // `se-components add`, which carries its own inlined copy): a second copy only works while
  // both stay byte-identical, then breaks codegen for the whole project (see operations.ts).
  const clientPath = join(clientDir, meta.clientFileName)
  const clientOperation = operationNames(resolveStringExport(packageSubpath, meta.clientQueryExport))[0]
  const existingDefinitions = clientOperation ? findOperationDefinitions('src', clientOperation, [clientPath]) : []

  if (existsSync(clientPath)) {
    summary.push(`⚠ ${clientPath} already exists — not touched.`)
  } else if (existingDefinitions.length > 0) {
    summary.push(
      `ℹ Skipped ${clientPath}: ${clientOperation} is already defined in ${existingDefinitions.join(', ')}. A second ` +
        "copy would break this project's GraphQL codegen (\"Not all operations have an unique name\") as soon " +
        'as the two copies differ.',
    )
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
      (existingDefinitions.length > 0
        ? `2. Nothing to import: ${existingDefinitions.join(', ')} already calls this operation.\n`
        : `2. Import ${meta.clientConstantName} from ${clientPath} in whatever component calls this operation.\n`) +
      '3. Run `faststore dev` / `faststore build` once so FastStore\'s own codegen generates the TS types for this operation.',
  )
}
