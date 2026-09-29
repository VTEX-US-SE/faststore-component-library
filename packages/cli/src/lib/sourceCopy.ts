import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface FoundDir {
  dir: string
  segment?: string
}

/**
 * Same two-probe-level convention as the schema/operation lookups elsewhere in this CLI
 * (direct, or one segment down), but for a whole directory rather than one file.
 */
export function findComponentDir(srcRoot: string, componentName: string): FoundDir | undefined {
  const direct = join(srcRoot, componentName)
  if (existsSync(direct)) return { dir: direct }

  for (const entry of readdirSync(srcRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const nested = join(srcRoot, entry.name, componentName)
    if (existsSync(nested)) return { dir: nested, segment: entry.name }
  }

  return undefined
}

/** Resolves `<packageName>`'s installed `src/` root in the CONSUMING project (from cwd). */
export function resolvePackageSrcRoot(packageName: string): string {
  let packageJsonPath: string
  try {
    packageJsonPath = require.resolve(`${packageName}/package.json`, { paths: [process.cwd()] })
  } catch {
    throw new Error(`${packageName} is not installed in this project. Run \`pnpm add ${packageName}\` first.`)
  }

  const srcRoot = join(dirname(packageJsonPath), 'src')
  if (!existsSync(srcRoot)) {
    throw new Error(
      `${packageName}'s installed copy has no src/ folder (found package.json at ${packageJsonPath}). ` +
        'This CLI needs a version of the package that ships raw source alongside dist/ — check you have the latest version.',
    )
  }

  return srcRoot
}

interface SourceFile {
  name: string
  content: string
}

/** Reads every file directly inside `dir` (not recursive — components aren't nested). */
function readDirFilesFlat(dir: string): SourceFile[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({ name: entry.name, content: readFileSync(join(dir, entry.name), 'utf-8') }))
}

/**
 * Whether this component's logic (in @vtex-us-se/components) touches @vtex-us-se/resolvers —
 * the signal this CLI uses to decide a component needs full source-copy distribution instead
 * of a plain npm import. See docs/copy-paste-components.md (or packages/resolvers/README.md)
 * for why: a component whose hook calls `gql()` on a string that only exists inside
 * node_modules can never be seen by the consuming project's own GraphQL codegen, no matter how
 * that hook is imported — the fix is for the hook's *source* (with the operation text already
 * inlined) to live inside the consumer's own src/, where codegen's static scan can see it.
 */
function referencesResolversPackage(files: SourceFile[]): boolean {
  return files.some((file) => file.content.includes('@vtex-us-se/resolvers'))
}

/** Escapes a GraphQL operation string for safe embedding inside a JS template literal. */
function escapeForTemplateLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}

/**
 * Resolves `@vtex-us-se/resolvers/<subpath>` from the CONSUMING project (from cwd) and returns
 * every STRING-valued named export — those are query/mutation text constants; the resolver
 * factory itself and any type-only export won't be strings, and are left alone.
 */
function resolveResolversStringExports(subpath: string): Record<string, string> {
  let modulePath: string
  try {
    modulePath = require.resolve(`@vtex-us-se/resolvers/${subpath}`, { paths: [process.cwd()] })
  } catch {
    throw new Error(
      `Could not resolve '@vtex-us-se/resolvers/${subpath}' from this project. Run \`pnpm add @vtex-us-se/resolvers\` first.`,
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(modulePath)
  const result: Record<string, string> = {}

  for (const [name, value] of Object.entries(mod)) {
    if (typeof value === 'string') result[name] = value
  }

  return result
}

/**
 * Rewrites one copied file's imports so it works standing alone in the consuming project:
 * - `@vtex-us-se/components(/segment)` -> `./index` (the copied components-package barrel now
 *   sits right next to this file).
 * - `@vtex-us-se/resolvers/<subpath>` named imports whose value is a query/mutation string are
 *   inlined as a literal template string wherever they're passed to `gql(...)`, and dropped
 *   from the import; any other name from the same import is left importing from the package
 *   (there's currently no such case in this library, but it's handled rather than assumed away).
 */
function rewriteImports(content: string): string {
  let result = content.replace(/from\s+(['"])@vtex-us-se\/components(?:\/[A-Za-z0-9_-]+)?\1/g, "from './index'")

  const resolversImportRe = /import\s*\{([^}]+)\}\s*from\s*(['"])@vtex-us-se\/resolvers\/([A-Za-z0-9_-]+)\2\s*\n?/g

  // Collected here rather than applied inside the .replace() callback below: reassigning the
  // outer `result` from inside a replacer callback doesn't stick -- String.prototype.replace
  // computes its return value from the ORIGINAL string it was called on, so any mutation to
  // `result` during the callback gets silently discarded the moment that outer call returns
  // and overwrites `result` with its own (unaware of the mutation) return value.
  const inlineReplacements: Array<{ name: string; literal: string }> = []

  result = result.replace(resolversImportRe, (_fullMatch, namesRaw: string, quote: string, subpath: string) => {
    const names = namesRaw
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
    const stringExports = resolveResolversStringExports(subpath)
    const remaining: string[] = []

    for (const name of names) {
      const value = stringExports[name]
      if (value === undefined) {
        remaining.push(name)
      } else {
        inlineReplacements.push({ name, literal: escapeForTemplateLiteral(value) })
      }
    }

    if (remaining.length === 0) return ''
    return `import { ${remaining.join(', ')} } from ${quote}@vtex-us-se/resolvers/${subpath}${quote}\n`
  })

  // Only the `gql(NAME)` call-site pattern is rewritten -- the one shape this library's own
  // hooks actually use these constants in.
  for (const { name, literal } of inlineReplacements) {
    const callRe = new RegExp(`gql\\(${name}\\)`, 'g')
    result = result.replace(callRe, `gql(\`${literal}\`)`)
  }

  return result
}

export interface CopyComponentSourceResult {
  copiedFiles: string[]
  usedSegments: { ui?: string; components?: string }
}

/**
 * Copies a component's full source (from both @vtex-us-se/ui and, if present, the matching
 * folder in @vtex-us-se/components) into `destDir`, flattened into one directory, with
 * cross-package imports rewritten to work standing alone. Never overwrites a file that already
 * exists at the destination (returns it in `skipped` instead) -- this can run again safely
 * after a manual edit.
 */
export function copyComponentSource(
  componentName: string,
  destDir: string,
): CopyComponentSourceResult & { skipped: string[] } {
  const uiSrcRoot = resolvePackageSrcRoot('@vtex-us-se/ui')
  const uiFound = findComponentDir(uiSrcRoot, componentName)
  if (!uiFound) {
    throw new Error(`No source folder found for "${componentName}" under ${uiSrcRoot}.`)
  }

  const uiFiles = readDirFilesFlat(uiFound.dir).filter((file) => !file.name.endsWith('.schema.jsonc'))

  let componentsFiles: SourceFile[] = []
  let componentsSegment: string | undefined
  try {
    const componentsSrcRoot = resolvePackageSrcRoot('@vtex-us-se/components')
    const componentsFound = findComponentDir(componentsSrcRoot, componentName)
    if (componentsFound) {
      componentsFiles = readDirFilesFlat(componentsFound.dir)
      componentsSegment = componentsFound.segment
    }
  } catch {
    // @vtex-us-se/components not installed, or has no src/ -- fine, this component may not need it.
  }

  mkdirSync(destDir, { recursive: true })

  const copiedFiles: string[] = []
  const skipped: string[] = []

  for (const file of [...uiFiles, ...componentsFiles]) {
    const destPath = join(destDir, file.name)
    if (existsSync(destPath)) {
      skipped.push(destPath)
      continue
    }

    const rewritten = rewriteImports(file.content)
    writeFileSync(destPath, rewritten)
    copiedFiles.push(destPath)
  }

  return {
    copiedFiles,
    skipped,
    usedSegments: { ui: uiFound.segment, components: componentsSegment },
  }
}

/** Whether `componentName` needs full source-copy distribution (see referencesResolversPackage). */
export function needsSourceCopy(componentName: string): boolean {
  let componentsSrcRoot: string
  try {
    componentsSrcRoot = resolvePackageSrcRoot('@vtex-us-se/components')
  } catch {
    return false
  }

  const found = findComponentDir(componentsSrcRoot, componentName)
  if (!found) return false

  return referencesResolversPackage(readDirFilesFlat(found.dir))
}
