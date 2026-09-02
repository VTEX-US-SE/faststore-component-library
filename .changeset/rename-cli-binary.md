---
"@vtex-us-se/cli": minor
---

**Breaking:** renamed the published binary from `equipo-components` to `se-components`.
Update any script or docs that invoke `equipo-components add <ComponentName>` to use
`se-components add <ComponentName>` instead. No compatibility alias is provided — this
package has no external consumers yet outside internal testing.
