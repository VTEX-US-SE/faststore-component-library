import { Command } from 'commander'
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

interface AddOptions {
  targetDir: string
  componentsIndex: string
  force: boolean
}

export const addCommand = new Command('add')
  .description(
    "Adds a component to the consuming project: copies its CMS schema into cms/faststore/, and registers " +
      'it in the custom-sections index file (src/components/index.tsx) if that file does not exist yet.',
  )
  .argument('<componentName>', 'Name of the component to add (must exist in @vtex-us-se/ui)')
  .option('-t, --target-dir <path>', "Consuming project's cms/faststore/ folder", 'cms/faststore')
  .option('-i, --components-index <path>', "Consuming project's custom-sections registry file", 'src/components/index.tsx')
  .option('-f, --force', 'overwrite the schema file if it already exists (never overwrites the components index)', false)
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
 * a correct `@vtex-us-se/ui/<segment>` import when registering the component.
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

function addComponent(componentName: string, options: AddOptions): void {
  const { targetDir, componentsIndex, force } = options
  const { schemaPath, segment } = resolveSchemaPath(componentName)

  const summary: string[] = []

  // 1. CMS schema
  const componentsDir = join(targetDir, 'components')
  const destPath = join(componentsDir, `cms_component__${componentName}.jsonc`)

  if (existsSync(destPath) && !force) {
    throw new Error(`${destPath} already exists. Pass --force to overwrite it (discards any manual edits).`)
  }

  mkdirSync(componentsDir, { recursive: true })
  copyFileSync(schemaPath, destPath)
  summary.push(`✔ Copied CMS schema → ${destPath}`)

  // 2. Custom-sections registry (src/components/index.tsx) — the file FastStore's CMS
  // resolves section keys against (its default export's keys must match each schema's
  // $componentKey). Only created when missing; a project with more than one custom section
  // already has one importing several components, and blindly overwriting it would drop those.
  const importSpecifier = segment ? `@vtex-us-se/ui/${segment}` : '@vtex-us-se/ui'

  if (existsSync(componentsIndex)) {
    summary.push(
      `⚠ ${componentsIndex} already exists — not touched. Make sure it imports and registers ${componentName}:\n\n` +
        `import { ${componentName} } from '${importSpecifier}'\n\n` +
        `export default {\n  ${componentName},\n  // ...your other custom sections\n}\n`,
    )
  } else {
    mkdirSync(dirname(componentsIndex), { recursive: true })
    writeFileSync(componentsIndex, `import { ${componentName} } from '${importSpecifier}'\n\nexport default {\n  ${componentName},\n}\n`)
    summary.push(`✔ Created ${componentsIndex} (registers ${componentName})`)
  }

  console.log(summary.join('\n'))
}
