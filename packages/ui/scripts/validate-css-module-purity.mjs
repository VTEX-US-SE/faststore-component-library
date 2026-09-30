// Compiles every *.module.scss with the same Sass compiler Storybook/most Next.js projects use,
// then re-applies webpack's own css-loader rule: a CSS Modules selector must contain at least one
// local class or id somewhere in its chain, or css-loader throws `Syntax error: Selector "..." is
// not pure`. Storybook's Vite build does NOT enforce this rule, so a component can pass every
// check in this repo and still fail to compile in a real Next.js project — this is the only thing
// that catches it before that happens (see SeBannerCarousel's `[data-fs-banner-carousel-arrows]`).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as sass from 'sass'

// `recursive: true` on readdirSync needs Node >=20.1 — matches this repo's CI Node version.
const files = readdirSync('src', { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.module.scss'))
  .map((entry) => join(entry.parentPath ?? entry.path, entry.name))

if (files.length === 0) {
  console.log('No .module.scss files found under src/ — nothing to validate.')
  process.exit(0)
}

// css-loader's own check considers a complex selector "pure" if any part of it — anywhere in the
// descendant/compound chain — is a local class or id. A substring check is a faithful match for
// that; attribute-value contents are blanked first so `[data-foo='a.b']` can't produce a false
// positive from a `.`/`#` that isn't actually a class/id token.
function isPureSelector(selector) {
  const withoutAttributeValues = selector.replace(/\[[^\]]*\]/g, '[]')
  return /[.#][a-zA-Z_-]/.test(withoutAttributeValues)
}

const KEYFRAMES_AT_RULE = /^@(-\w+-)?keyframes\b/
const RECURSABLE_AT_RULE = /^@(media|supports|layer|container|document)\b/

// Minimal brace-matching walk over compiled (already-flattened) CSS — not a full CSS parser, but
// sufficient for output `sass.compile` produces from these files: no braces inside strings/values.
function findImpureSelectors(css, file, problems) {
  let i = 0

  function walk(skipSelectorChecks) {
    while (i < css.length) {
      while (i < css.length && /\s/.test(css[i])) i++
      if (i >= css.length) return
      if (css[i] === '}') {
        i++
        return
      }

      const start = i
      while (i < css.length && css[i] !== '{' && css[i] !== '}' && css[i] !== ';') i++
      const prelude = css.slice(start, i).trim()

      if (css[i] === ';') {
        i++ // plain statement (e.g. `@import url(...);`) — no selector, no body to descend into
        continue
      }
      if (css[i] === '}') {
        i++
        continue
      }

      i++ // consume the opening `{`

      if (prelude.startsWith('@')) {
        if (KEYFRAMES_AT_RULE.test(prelude)) {
          walk(true) // `0%`/`50%`/`from`/`to` aren't selectors — never flag them
        } else if (RECURSABLE_AT_RULE.test(prelude)) {
          walk(skipSelectorChecks) // @media/@supports/@layer/etc. wrap real selectors — recurse into them
        } else {
          walk(true) // @font-face, @page, and anything else with no selectors of its own
        }
        continue
      }

      if (!skipSelectorChecks) {
        for (const rawSelector of prelude.split(',')) {
          const selector = rawSelector.trim()

          if (selector && !isPureSelector(selector)) {
            problems.push({ file, selector })
          }
        }
      }

      walk(skipSelectorChecks)
    }
  }

  walk(false)
}

let hasErrors = false

for (const file of files) {
  const problems = []

  try {
    // `loadPaths: ['node_modules']` mirrors how bundler sass-loaders resolve bare imports like
    // `include-media/dist/include-media` or `@faststore/ui/src/...` — plain `sass.compile` only
    // resolves relative paths.
    const { css } = sass.compile(file, {
      style: 'expanded',
      loadPaths: ['node_modules'],
      // `include-media`'s own Sass has pre-existing, unrelated deprecation warnings (legacy
      // `@import`, old global functions) — not this script's concern; keep its output focused
      // on selector purity and real compile errors.
      logger: { warn: () => {} },
    })

    findImpureSelectors(css, file, problems)
  } catch (error) {
    hasErrors = true
    console.error(`✘ ${file} — failed to compile`)
    console.error(error instanceof Error ? error.message : error)
    continue
  }

  if (problems.length > 0) {
    hasErrors = true
    console.error(`✘ ${file}`)
    for (const { selector } of problems) {
      console.error(`    not pure: ${selector}`)
    }
  } else {
    console.log(`✔ ${file}`)
  }
}

if (hasErrors) {
  console.error(
    '\nEvery selector in a CSS Module must contain at least one local class or id somewhere in ' +
      'its chain — webpack\'s css-loader (Next.js\'s CSS Modules) throws `Syntax error: Selector ' +
      '"..." is not pure` otherwise. Nest attribute/tag-only selectors inside a local class ' +
      "block instead (see SeBanner's or SeBannerCarousel's [data-fs-*] selectors for the pattern).",
  )
  process.exit(1)
}
