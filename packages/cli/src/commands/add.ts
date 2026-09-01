import { Command } from 'commander'

interface AddOptions {
  targetDir: string
}

export const addCommand = new Command('add')
  .description('Agrega un componente al proyecto consumidor, copiando su schema de CMS a cms/faststore/')
  .argument('<componentName>', 'Nombre del componente a agregar (debe existir en @vtex-us-se/ui)')
  .option('-t, --target-dir <path>', 'Carpeta cms/faststore/ del proyecto consumidor', 'cms/faststore')
  .action((componentName: string, options: AddOptions) => {
    copySchema(componentName, options.targetDir)
  })

/**
 * TODO: localizar <ComponentName>.schema.jsonc en @vtex-us-se/ui y copiarlo a targetDir.
 */
function copySchema(componentName: string, targetDir: string): void {
  throw new Error(`copySchema no implementado todavía (componente: ${componentName}, destino: ${targetDir})`)
}
