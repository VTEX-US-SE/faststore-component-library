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
  operationType: 'Mutation' | 'Query'
  fieldName: string
  factoryExport: string
  configParams: string[]
  clientQueryExport: string
  clientFileName: string
  clientConstantName: string
}

export const addResolverCommand = new Command('add-resolver')
  .description(
    'Copies a @vtex-us-se/resolvers operation (typeDef + client query) into the consuming project, ' +
      'and scaffolds the server resolver index and client query wrapper if they do not exist yet.',
  )
  .argument('<operationName>', 'Name of the GraphQL operation to add (must exist in @vtex-us-se/resolvers)')
  .option('-t, --target-dir <path>', "Consuming project's src/graphql/ folder", 'src/graphql')
  .option('-c, --client-dir <path>', "Consuming project's client query folder", 'src/utils')
  .option('-n, --namespace <name>', 'GraphQL extension namespace to write under', 'b2b')
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
 */
function findAssetPath(distRoot: string, operationName: string, extension: string): string | undefined {
  const direct = join(distRoot, operationName, `${operationName}${extension}`)
  if (existsSync(direct)) return direct

  for (const entry of readdirSync(distRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const nested = join(distRoot, entry.name, operationName, `${operationName}${extension}`)
    if (existsSync(nested)) return nested
  }

  return undefined
}

/**
 * Resolves the .graphql and .meta.json for <operationName> from whichever @vtex-us-se/resolvers
 * is installed in the CONSUMING project (resolved from cwd, not from this CLI's own node_modules).
 */
function resolveOperationAssets(operationName: string): { graphqlPath: string; metaPath: string } {
  let resolversPackageJsonPath: string
  try {
    resolversPackageJsonPath = require.resolve('@vtex-us-se/resolvers/package.json', {
      paths: [process.cwd()],
    })
  } catch {
    throw new Error('@vtex-us-se/resolvers is not installed in this project. Run `pnpm add @vtex-us-se/resolvers` first.')
  }

  const distRoot = join(dirname(resolversPackageJsonPath), 'dist')
  const graphqlPath = findAssetPath(distRoot, operationName, '.graphql')
  const metaPath = findAssetPath(distRoot, operationName, '.meta.json')

  if (!graphqlPath || !metaPath) {
    throw new Error(
      `No operation found for "${operationName}" under ${distRoot}. Check the operation name — it must match ` +
        'the operation folder name under @vtex-us-se/resolvers/src exactly (case-sensitive).',
    )
  }

  return { graphqlPath, metaPath }
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

function buildResolverSnippet(meta: OperationMeta, namespace: string, vtexConfig: { storeId?: string; environment?: string }): string {
  const resolverVarName = meta.operationType === 'Mutation' ? 'mutationResolver' : 'queryResolver'
  const storeIdLine = vtexConfig.storeId
    ? `storeId: '${vtexConfig.storeId}',`
    : `storeId: 'YOUR_STORE_ID', // TODO: replace with your VTEX account id (see discovery.config.js -> api.storeId)`
  const environmentLine = vtexConfig.environment ? `\n      environment: '${vtexConfig.environment}',` : ''

  return `import { ${meta.factoryExport} } from '@vtex-us-se/resolvers/${namespace}'

const ${resolverVarName} = {
  ${meta.operationType}: {
    ${meta.fieldName}: ${meta.factoryExport}({
      ${storeIdLine}${environmentLine}
    }),
  },
}

export default ${resolverVarName}
`
}

function buildClientWrapperSnippet(meta: OperationMeta, namespace: string): string {
  return `import { gql } from '@faststore/core/api'
import { ${meta.clientQueryExport} } from '@vtex-us-se/resolvers/${namespace}'

export const ${meta.clientConstantName} = gql(${meta.clientQueryExport})
`
}

function addResolver(operationName: string, options: AddResolverOptions): void {
  const { targetDir, clientDir, namespace, force } = options
  const { graphqlPath, metaPath } = resolveOperationAssets(operationName)
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

  // 2. server resolver index (create only if missing, never overwrite)
  const vtexConfig = detectVtexApiConfig()
  const resolverFileName = meta.operationType === 'Mutation' ? 'mutationResolver.ts' : 'queryResolver.ts'
  const resolverPath = join(targetDir, namespace, 'resolvers', resolverFileName)
  const resolverSnippet = buildResolverSnippet(meta, namespace, vtexConfig)

  if (existsSync(resolverPath)) {
    summary.push(
      `⚠ ${resolverPath} already exists — not touched. Add this to its "${meta.operationType}" object by hand:\n\n${resolverSnippet}`,
    )
  } else {
    mkdirSync(dirname(resolverPath), { recursive: true })
    writeFileSync(resolverPath, resolverSnippet)
    const storeIdNote = vtexConfig.storeId ? ` (storeId auto-detected: ${vtexConfig.storeId})` : ' (storeId left as a TODO placeholder)'
    summary.push(`✔ Created ${resolverPath}${storeIdNote}`)
  }

  // 3. client query wrapper (create only if missing, never overwrite)
  const clientPath = join(clientDir, meta.clientFileName)
  const clientSnippet = buildClientWrapperSnippet(meta, namespace)

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
      '(local — never commit real values).\n' +
      `2. Import ${meta.clientConstantName} from ${clientPath} in whatever component calls this operation.\n` +
      '3. Run `faststore dev` / `faststore build` once so FastStore\'s own codegen generates the TS types for this operation.',
  )
}
