import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const SOURCE_FILE = /\.(ts|tsx)$/
const SKIPPED_DIRS = new Set(['node_modules', '.next', '@generated', 'dist'])

/** Names of the GraphQL operations defined in a raw GraphQL document (e.g. `SeSubmitOrganizationRequest`). */
export function operationNames(document: string): string[] {
  return [...document.matchAll(/\b(?:query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]*)/g)].map(
    (match) => match[1] as string,
  )
}

/**
 * Names of the operations a TS/TSX file defines through `gql(\`...\`)` -- anchored on the call
 * (what FastStore's codegen itself scans for), so prose like "the mutation text" in a comment
 * isn't mistaken for an operation named `text`.
 */
export function gqlOperationNames(source: string): string[] {
  return [...source.matchAll(/gql\(\s*`\s*(?:query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]*)/g)].map(
    (match) => match[1] as string,
  )
}

function listSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return []

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : listSourceFiles(join(dir, entry.name))
    return SOURCE_FILE.test(entry.name) ? [join(dir, entry.name)] : []
  })
}

/**
 * Files under `srcDir` (relative to cwd) that define the operation `name`, skipping anything
 * under `excludePaths`. FastStore's codegen scans every `src/**\/*.{ts,tsx}`: two definitions of
 * one operation name pass only while their text is byte-identical -- the moment one copy
 * changes (an upgrade re-copies one file but not the other), the whole codegen run fails with
 * "Not all operations have an unique name" and generates nothing.
 */
export function findOperationDefinitions(srcDir: string, name: string, excludePaths: string[] = []): string[] {
  const excluded = excludePaths.map((path) => resolve(path))
  const definition = new RegExp(`gql\\(\\s*\`\\s*(?:query|mutation|subscription)\\s+${name}\\b`)

  return listSourceFiles(srcDir)
    .filter((file) => !excluded.some((path) => resolve(file).startsWith(path)))
    .filter((file) => definition.test(readFileSync(file, 'utf-8')))
    .map((file) => relative(process.cwd(), file))
}
