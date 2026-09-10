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
    // Storybook resolves our own workspace packages straight to their TS source instead of
    // their compiled dist/ (CommonJS, for real external Next.js/webpack consumers). This
    // sidesteps a real rabbit hole: Vite/Rollup's CJS→ESM interop keys off the resolved
    // path containing "node_modules" (true for real deps, false for pnpm-symlinked
    // workspace packages — their *real* path is just packages/ui/dist, no "node_modules"
    // segment), and esbuild's dev-server pre-bundler has an equivalent but separate gap
    // (it only produces a `default` export for these, dropping named exports like
    // `SeBanner`) — chasing each Vite subsystem's version of this bug isn't worth it when
    // Storybook can just compile TS source directly, which it already knows how to do.
    viteConfig.resolve ??= {}
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias as Record<string, string> | undefined),
      // @faststore/core ships raw TS source with no compiled artifact — importing its real
      // /experimental or /api subpaths drags in internal SDK modules that only resolve inside a
      // real FastStore project's own bundler config, crashing Vite's dependency scan for every
      // story (not just the one that needs it). See mocks/faststore-core-*.ts.
      '@faststore/core/experimental': fileURLToPath(
        new URL('./mocks/faststore-core-experimental.ts', import.meta.url),
      ),
      '@faststore/core/api': fileURLToPath(new URL('./mocks/faststore-core-api.ts', import.meta.url)),
      '@vtex-us-se/ui/b2c': fileURLToPath(new URL('../../ui/src/b2c/index.ts', import.meta.url)),
      '@vtex-us-se/ui/b2b': fileURLToPath(new URL('../../ui/src/b2b/index.ts', import.meta.url)),
      '@vtex-us-se/ui': fileURLToPath(new URL('../../ui/src/index.ts', import.meta.url)),
      '@vtex-us-se/components/b2c': fileURLToPath(
        new URL('../../components/src/b2c/index.ts', import.meta.url),
      ),
      '@vtex-us-se/components/b2b': fileURLToPath(
        new URL('../../components/src/b2b/index.ts', import.meta.url),
      ),
      '@vtex-us-se/components': fileURLToPath(
        new URL('../../components/src/index.ts', import.meta.url),
      ),
      '@vtex-us-se/resolvers/b2b': fileURLToPath(
        new URL('../../resolvers/src/b2b/index.ts', import.meta.url),
      ),
      '@vtex-us-se/resolvers': fileURLToPath(new URL('../../resolvers/src/index.ts', import.meta.url)),
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
