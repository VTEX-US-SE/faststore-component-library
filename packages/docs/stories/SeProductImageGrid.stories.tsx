import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeProductImageGrid } from '@vtex-us-se/ui'
import type { SeProductImageGridItem } from '@vtex-us-se/components'

// Storybook-only placeholder fixtures — not real VTEX/Thumbor asset URLs.
const items: SeProductImageGridItem[] = Array.from({ length: 12 }, (_, index) => ({
  image: `https://placehold.co/400x400/png?text=${index + 1}`,
  alt: `Placeholder product ${index + 1}`,
  link: `#product-${index + 1}`,
}))

const meta: Meta<typeof SeProductImageGrid> = {
  title: 'Components/SeProductImageGrid',
  component: SeProductImageGrid,
}

export default meta

type Story = StoryObj<typeof SeProductImageGrid>

export const Default: Story = {
  args: { items },
}

export const FourColumns: Story = {
  args: { items: items.slice(0, 8), columns: { desktop: 4, mobile: 2 } },
}

export const Empty: Story = {
  args: { items: [] },
}
