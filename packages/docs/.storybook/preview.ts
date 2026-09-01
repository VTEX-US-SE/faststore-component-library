// Only the design-token custom properties (e.g. --fs-grid-max-width) — not the full
// global.scss chain, which also pulls in a reset/typography/layout reset we don't want
// applied wholesale to this Storybook sandbox, and which needs `modern-normalize`
// resolvable via a bare `~` import that this monorepo doesn't hoist.
import './faststore-tokens.scss'
import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
  },
}

export default preview
