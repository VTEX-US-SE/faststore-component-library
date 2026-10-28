import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeEditorialSplit } from '@vtex-us-se/ui'
import type { SeEditorialSplitItem } from '@vtex-us-se/components'

// Storybook-only placeholder fixtures — not real VTEX/Thumbor asset URLs.
const PLACEHOLDER_IMAGE = (bg: string) => `https://placehold.co/1200x1600/${bg}/fff`

const items: SeEditorialSplitItem[] = [
  { image: PLACEHOLDER_IMAGE('555'), alt: 'Placeholder editorial A', title: 'Women', link: '#women' },
  { image: PLACEHOLDER_IMAGE('888'), alt: 'Placeholder editorial B', title: 'Kids', link: '#kids' },
]

const meta: Meta<typeof SeEditorialSplit> = {
  title: 'Components/SeEditorialSplit',
  component: SeEditorialSplit,
}

export default meta

type Story = StoryObj<typeof SeEditorialSplit>

export const Default: Story = {
  args: { items },
}

export const ThreeColumnsSquareOverlay: Story = {
  args: {
    columns: 3,
    aspectRatio: '1:1',
    captionPosition: 'overlay',
    items: [
      ...items,
      { image: PLACEHOLDER_IMAGE('222'), alt: 'Placeholder editorial C', title: 'Home', link: '#home' },
    ],
  },
}

export const WithoutCaptions: Story = {
  args: { items: items.map(({ image, alt }) => ({ image, alt })) },
}
