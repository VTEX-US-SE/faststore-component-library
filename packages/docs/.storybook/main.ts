import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

// Load paths so bare `@import 'pkg/...'` in .scss files resolve to the pnpm-hoisted
// root node_modules — needed because `~pkg`-style tilde imports resolve inconsistently
// depending on which file triggers the Sass compilation (root entry vs. nested import).
const rootNodeModules = fileURLToPath(new URL('../../../../node_modules', import.meta.url))

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.css ??= {}
    viteConfig.css.preprocessorOptions ??= {}
    viteConfig.css.preprocessorOptions.scss = {
      ...viteConfig.css.preprocessorOptions.scss,
      includePaths: [
        rootNodeModules,
        ...(viteConfig.css.preprocessorOptions.scss?.includePaths ?? []),
      ],
    }
    return viteConfig
  },
}

export default config
