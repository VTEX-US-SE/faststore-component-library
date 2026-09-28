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
}

export const addResolverCommand = new Command('add-resolver')
  .description(
    'Copies a @vtex-us-se/resolvers operation (typeDef + client query) into the consuming project, ' +
      'and scaffolds the server resolver index and client query wrapper if they do not exist yet.',
  )
  .argument('<operationName>', 'Name of the GraphQL operation to add (must exist in @vtex-us-se/resolvers)')
  .option('-t, --target-dir <path>', "Consuming project's src/graphql/ folder", 'src/graphql')
  .option('-c, --client-dir <path>', "Consuming project's client query folder", 'src/utils')
  .option('-n, --namespace <name>', 'GraphQL extension namespace to write under', 'b2c')
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

/** A resolver file's own base name, so a "map"-shaped operation doesn't collide with, or get
 *  mislabeled as, a single "mutationResolver.ts"/"queryResolver.ts" for the same namespace. */
function resolverFileNameFor(operationName: string, meta: OperationMeta): string {
  if (meta.resolverShape === 'map') {
    return `${operationName}Resolver.ts`
  }

  return meta.operationType === 'Mutation' ? 'mutationResolver.ts' : 'queryResolver.ts'
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

function buildClientWrapperSnippet(meta: OperationMeta, packageSubpath: string): string {
  return `import { gql } from '@faststore/core/api'
import { ${meta.clientQueryExport} } from '@vtex-us-se/resolvers/${packageSubpath}'

export const ${meta.clientConstantName} = gql(${meta.clientQueryExport})
`
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

  // 2. server resolver (create only if missing, never overwrite)
  const vtexConfig = detectVtexApiConfig()
  const resolverFileName = resolverFileNameFor(operationName, meta)
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
        'check its other top-level keys, e.g. a field extension on an existing type, before assuming this namespace is the right home for all of them).',
    )
  }

  // 3. resolvers aggregator — the actual file FastStore's GraphQL server loads for this
  // namespace (see AGENTS.md/the resolvers README: "Aggregates all resolvers"). Only created
  // when missing; never overwritten, since a namespace with more than one operation already
  // has one merging several imports, and blindly overwriting it would drop those.
  const aggregatorPath = join(targetDir, namespace, 'resolvers', 'index.ts')
  const resolverModuleName = resolverFileName.replace(/\.ts$/, '')

  if (existsSync(aggregatorPath)) {
    summary.push(
      `⚠ ${aggregatorPath} already exists — not touched. Make sure its default export merges in ` +
        `./${resolverModuleName}'s default export (spread its keys — e.g. Mutation, or a type name — ` +
        'alongside whatever this namespace already registers).',
    )
  } else {
    mkdirSync(dirname(aggregatorPath), { recursive: true })
    writeFileSync(aggregatorPath, `export { default } from './${resolverModuleName}'\n`)
    summary.push(`✔ Created ${aggregatorPath} (re-exports ./${resolverModuleName})`)
  }

  // 3. client query wrapper (create only if missing, never overwrite)
  const clientPath = join(clientDir, meta.clientFileName)
  const clientSnippet = buildClientWrapperSnippet(meta, packageSubpath)

  if (existsSync(clientPath)) {
    summary.push(`⚠ ${clientPath} already exists — not touched. Expected content:\n\n${clientSnippet}`)
  } else {
    mkdirSync(dirname(clientPath), { recursive: true })
    writeFileSync(clientPath, clientSnippet)
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
