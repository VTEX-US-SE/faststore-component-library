import { Command } from 'commander'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { copyComponentSource, needsSourceCopy } from '../lib/sourceCopy'

interface AddOptions {
  targetDir: string
  componentsIndex: string
  sourceDir?: string
  force: boolean
}

export const addCommand = new Command('add')
  .description(
    'Adds a component to the consuming project: copies its CMS schema into cms/faststore/, and registers it ' +
      'in the custom-sections index file (src/components/index.tsx, created or merged into if missing an entry). ' +
      'For components whose logic touches @vtex-us-se/resolvers (their GraphQL operations can never be seen by ' +
      "this project's own codegen if only imported from node_modules), copies the component's full source " +
      'instead of just its schema, with operation text inlined -- see packages/resolvers/README.md.',
  )
  .argument('<componentName>', 'Name of the component to add (must exist in @vtex-us-se/ui)')
  .option('-t, --target-dir <path>', "Consuming project's cms/faststore/ folder", 'cms/faststore')
  .option('-i, --components-index <path>', "Consuming project's custom-sections registry file", 'src/components/index.tsx')
  .option(
    '-s, --source-dir <path>',
    'Where to copy full source for a GraphQL-dependent component (default: src/components/sections/<ComponentName>)',
  )
  .option('-f, --force', 'overwrite the schema file if it already exists (never overwrites source or the components index)', false)
  .action((componentName: string, options: AddOptions) => {
    try {
      addComponent(componentName, options)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  })

/**
 * Looks for <componentName>/<componentName>.schema.jsonc directly under `dist`, and — since
 * components live under a segment folder (dist/b2c/<Name>, dist/b2b/<Name>) — one level down
 * inside each of dist's immediate subdirectories. Not recursive beyond that: components aren't
 * nested more than one segment deep. Also returns that segment (e.g. "b2c"), needed to generate
 * a correct `@vtex-us-se/ui/<segment>` import for components that don't need a source copy.
 */
function findSchemaPath(distRoot: string, componentName: string): { path: string; segment?: string } | undefined {
  const direct = join(distRoot, componentName, `${componentName}.schema.jsonc`)
  if (existsSync(direct)) return { path: direct }

  for (const entry of readdirSync(distRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const nested = join(distRoot, entry.name, componentName, `${componentName}.schema.jsonc`)
    if (existsSync(nested)) return { path: nested, segment: entry.name }
  }

  return undefined
}

/**
 * Resolves <ComponentName>.schema.jsonc from whichever @vtex-us-se/ui is installed in the
 * CONSUMING project (resolved from cwd, not from this CLI's own node_modules) — that's the
 * version whose schema should actually be copied.
 */
function resolveSchemaPath(componentName: string): { schemaPath: string; segment?: string } {
  let uiPackageJsonPath: string
  try {
    uiPackageJsonPath = require.resolve('@vtex-us-se/ui/package.json', {
      paths: [process.cwd()],
    })
  } catch {
    throw new Error('@vtex-us-se/ui is not installed in this project. Run `pnpm add @vtex-us-se/ui` first.')
  }

  const distRoot = join(dirname(uiPackageJsonPath), 'dist')
  const found = findSchemaPath(distRoot, componentName)
  if (!found) {
    throw new Error(
      `No schema found for "${componentName}" under ${distRoot}. Check the component name — it must match ` +
        'the component folder name under @vtex-us-se/ui/src exactly (case-sensitive).',
    )
  }
  return { schemaPath: found.path, segment: found.segment }
}

/** A relative-from-componentsIndex import specifier (always `./` or `../`-prefixed), extensionless. */
function relativeImportSpecifier(componentsIndex: string, targetFileNoExt: string): string {
  const rel = relative(dirname(componentsIndex), targetFileNoExt).replace(/\\/g, '/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

/**
 * Registers `componentName` in the custom-sections index, creating it if missing. If it already
 * exists, attempts a safe merge — only for the simple `export default { A, B, C }` shape (bare
 * identifiers, no spreads/computed keys); anything less predictable is left untouched with
 * instructions printed instead, since silently mis-merging a consumer's own file is worse than
 * asking them to add one line by hand.
 */
function registerInComponentsIndex(componentsIndex: string, componentName: string, importSpecifier: string): string {
  const importLine = `import { ${componentName} } from '${importSpecifier}'`

  if (!existsSync(componentsIndex)) {
    mkdirSync(dirname(componentsIndex), { recursive: true })
    writeFileSync(componentsIndex, `${importLine}\n\nexport default {\n  ${componentName},\n}\n`)
    return `✔ Created ${componentsIndex} (registers ${componentName})`
  }

  const content = readFileSync(componentsIndex, 'utf-8')

  if (new RegExp(`import\\s*\\{[^}]*\\b${componentName}\\b[^}]*\\}\\s*from`).test(content)) {
    return `ℹ ${componentsIndex} already imports ${componentName} — left untouched.`
  }

  const exportMatch = content.match(/export default\s*\{([\s\S]*?)\}/)
  const bodyLines = (exportMatch?.[1] ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const isSimpleObject = exportMatch !== null && bodyLines.every((line) => /^[A-Za-z_$][A-Za-z0-9_$]*\s*,?$/.test(line))

  if (!isSimpleObject) {
    return (
      `⚠ ${componentsIndex} already exists, and its default export isn't a plain \`{ A, B, C }\` object of bare ` +
      "names (or wasn't found at all) — this CLI won't risk merging it automatically. Add these by hand:\n\n" +
      `${importLine}\n\n` +
      `...and add \`${componentName},\` inside its default export object.`
    )
  }

  const insertionPoint = content.indexOf('export default')
  const withImport = content.slice(0, insertionPoint) + `${importLine}\n` + content.slice(insertionPoint)
  const merged = withImport.replace(/export default\s*\{([\s\S]*?)\}/, (_match, inner: string) => {
    const trimmedInner = inner.replace(/\s+$/, '')
    const needsComma = trimmedInner.trim().length > 0 && !trimmedInner.trimEnd().endsWith(',')
    return `export default {${trimmedInner}${needsComma ? ',' : ''}\n  ${componentName},\n}`
  })

  writeFileSync(componentsIndex, merged)
  return `✔ Registered ${componentName} in ${componentsIndex} (merged into its existing default export)`
}

function addComponent(componentName: string, options: AddOptions): void {
  const { targetDir, componentsIndex, force } = options
  const summary: string[] = []

  // 1. CMS schema — same regardless of distribution mode.
  const { schemaPath, segment } = resolveSchemaPath(componentName)
  const componentsDir = join(targetDir, 'components')
  const destPath = join(componentsDir, `cms_component__${componentName}.jsonc`)

  if (existsSync(destPath) && !force) {
    throw new Error(`${destPath} already exists. Pass --force to overwrite it (discards any manual edits).`)
  }

  mkdirSync(componentsDir, { recursive: true })
  copyFileSync(schemaPath, destPath)
  summary.push(`✔ Copied CMS schema → ${destPath}`)

  // 2. Component itself: full source copy (GraphQL-dependent) or a plain npm import.
  if (needsSourceCopy(componentName)) {
    const sourceDir = options.sourceDir ?? join('src', 'components', 'sections', componentName)
    const { copiedFiles, skipped } = copyComponentSource(componentName, sourceDir)

    for (const file of copiedFiles) summary.push(`✔ Copied ${file}`)
    for (const file of skipped) summary.push(`ℹ ${file} already exists — left untouched.`)

    summary.push(
      `ℹ ${componentName} touches @vtex-us-se/resolvers, so its full source (not just the schema) was copied into ` +
        `${sourceDir} — this project's own GraphQL codegen can only see \`gql(...)\` calls with literal query text ` +
        "inside this project's own src/, not inside node_modules. Re-run this command after upgrading " +
        '@vtex-us-se/ui/@vtex-us-se/components/@vtex-us-se/resolvers to pick up changes (it never overwrites ' +
        'existing files, so re-apply any local edits by hand, or delete the folder first to take the fresh copy).',
    )

    const importSpecifier = relativeImportSpecifier(componentsIndex, join(sourceDir, componentName))
    summary.push(registerInComponentsIndex(componentsIndex, componentName, importSpecifier))
  } else {
    const importSpecifier = segment ? `@vtex-us-se/ui/${segment}` : '@vtex-us-se/ui'
    summary.push(registerInComponentsIndex(componentsIndex, componentName, importSpecifier))
  }

  console.log(summary.join('\n'))
}
