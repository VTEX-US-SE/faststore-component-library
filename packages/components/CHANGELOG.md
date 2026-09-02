# @vtex-us-se/components

## 0.0.1

### Patch Changes

- 2fbdd82: Fix a packaging bug that broke `require()`/`import` of the compiled package in any
  Node.js or Next.js (SSR) consumer, reproducible with `node -e "require('@vtex-us-se/ui')"`.

  The shared `tsconfig.base.json` compiled to ESM syntax (`export { X } from './x'`, no file
  extension) while `package.json` didn't declare `"type": "module"`. Node then autodetected the
  compiled `.js` files as ES modules by their syntax, but ESM resolution requires explicit
  extensions on relative imports — which the emitted code didn't have — causing
  `ERR_MODULE_NOT_FOUND`. Compiling to CommonJS instead (`module: "commonjs"`,
  `moduleResolution: "node"`) sidesteps the issue entirely, matching how the rest of the
  FastStore/VTEX ecosystem consumes these packages (CJS/webpack, not pure ESM).
