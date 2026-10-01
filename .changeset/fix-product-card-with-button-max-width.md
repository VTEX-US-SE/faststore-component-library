---
"@vtex-us-se/ui": patch
---

Fix `SeProductCardWithButton` rendering at full page width (and its 1:1 image along with it)
when added as a standalone CMS section instead of inside a shelf/PLP grid. `.card` had
`width: 100%` and nothing else constraining it — found by adding it as a single section on a
page: the card (and its square image) stretched to the full page width with no grid around it
to size it down.

`@faststore/ui`'s own `ProductCard` only gets its real width from `ProductShelf`'s
`grid-template-columns`, not from anything in the card's own CSS, so the same gap exists there
too in theory — but `SeProductCardWithButton` is more likely to get dropped in standalone since
its schema technically allows it even though it's meant for a shelf slot (see its own doc
comment). Added a defensive `max-width: 20rem` to `.card` so a lone instance doesn't look
broken; a real shelf's grid cell is normally already narrower than that, so this doesn't change
actual shelf usage.
