// Config base compartida. Cada paquete la re-exporta o extiende desde su propio eslint.config.js:
//   import base from '@vtex-us-se/config/eslint.config.js'
//   export default [...base, { /* overrides del paquete */ }]
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  rules: {},
})
