// Parses every .graphql typeDef in src/ with graphql-js, so a syntax error (e.g. a description
// block placed over an `extend type`/`extend input`, which graphql-js rejects even though it's
// easy to write by hand) fails in CI instead of surfacing only once a consuming project's
// GraphQL server tries to build its schema.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'graphql'

// `recursive: true` on readdirSync needs Node >=20.1 — matches this repo's CI Node version.
const files = readdirSync('src', { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.graphql'))
  .map((entry) => join(entry.parentPath ?? entry.path, entry.name))

if (files.length === 0) {
  console.log('No .graphql files found under src/ — nothing to validate.')
  process.exit(0)
}

let hasErrors = false

for (const file of files) {
  try {
    parse(readFileSync(file, 'utf-8'))
    console.log(`✔ ${file}`)
  } catch (error) {
    hasErrors = true
    console.error(`✘ ${file}`)
    console.error(error instanceof Error ? error.message : error)
  }
}

if (hasErrors) {
  process.exit(1)
}
