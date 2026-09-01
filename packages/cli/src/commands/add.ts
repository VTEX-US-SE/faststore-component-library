import { Command } from 'commander'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

interface AddOptions {
  targetDir: string
  force: boolean
}

export const addCommand = new Command('add')
  .description("Adds a component to the consuming project, copying its CMS schema into cms/faststore/")
  .argument('<componentName>', 'Name of the component to add (must exist in @vtex-us-se/ui)')
  .option('-t, --target-dir <path>', "Consuming project's cms/faststore/ folder", 'cms/faststore')
  .option('-f, --force', 'overwrite the schema file if it already exists', false)
  .action((componentName: string, options: AddOptions) => {
    try {
      copySchema(componentName, options.targetDir, options.force)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  })

/**
 * Resolves <ComponentName>.schema.jsonc from whichever @vtex-us-se/ui is installed in the
 * CONSUMING project (resolved from cwd, not from this CLI's own node_modules) — that's the
 * version whose schema should actually be copied.
 */
function resolveSchemaPath(componentName: string): string {
  let uiPackageJsonPath: string
  try {
    uiPackageJsonPath = require.resolve('@vtex-us-se/ui/package.json', {
      paths: [process.cwd()],
    })
  } catch {
    throw new Error('@vtex-us-se/ui is not installed in this project. Run `pnpm add @vtex-us-se/ui` first.')
  }

  const schemaPath = join(dirname(uiPackageJsonPath), 'dist', componentName, `${componentName}.schema.jsonc`)
  if (!existsSync(schemaPath)) {
    throw new Error(
      `No schema found for "${componentName}" at ${schemaPath}. Check the component name — it must match ` +
        'the component folder name under @vtex-us-se/ui/src exactly (case-sensitive).',
    )
  }
  return schemaPath
}

function copySchema(componentName: string, targetDir: string, force: boolean): void {
  const sourcePath = resolveSchemaPath(componentName)

  const componentsDir = join(targetDir, 'components')
  const destPath = join(componentsDir, `cms_component__${componentName}.jsonc`)

  if (existsSync(destPath) && !force) {
    throw new Error(`${destPath} already exists. Pass --force to overwrite it (discards any manual edits).`)
  }

  mkdirSync(componentsDir, { recursive: true })
  copyFileSync(sourcePath, destPath)

  console.log(`Copied ${componentName}'s CMS schema to ${destPath}`)
}
