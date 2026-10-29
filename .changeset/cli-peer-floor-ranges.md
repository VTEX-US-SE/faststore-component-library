---
"@vtex-us-se/cli": patch
---

Declare the optional `@vtex-us-se/ui` / `@vtex-us-se/resolvers` peers as floor ranges (`>=0.8.0` /
`>=0.4.0`) instead of the exact versions `workspace:*` published. The CLI only resolves them from
the consuming project at runtime, so it works with newer releases. This also stops the CLI from
getting a new major version every time `ui` or `resolvers` is released.
