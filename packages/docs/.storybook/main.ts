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
    // Vite/Rollup only runs CJS→ESM interop on files whose resolved path contains
    // "node_modules" — true for real external deps (their pnpm store path always does),
    // but false for our own pnpm-symlinked workspace packages, since their *real* path is
    // just packages/ui/dist, packages/components/dist (no "node_modules" segment at all).
    // Without this, their compiled CommonJS output gets parsed as plain ESM source and
    // named imports (e.g. `SeBanner`) silently fail to resolve.
    viteConfig.build ??= {}
    viteConfig.build.commonjsOptions = {
      ...viteConfig.build.commonjsOptions,
      include: [/node_modules/, /packages\/(ui|components)\/dist\//],
    }

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
