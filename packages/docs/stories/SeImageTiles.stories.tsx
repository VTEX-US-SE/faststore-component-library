import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeImageTiles } from '@vtex-us-se/ui'

// Storybook-only placeholder fixtures — not real VTEX/Thumbor asset URLs.
const TILE_A = { src: 'https://placehold.co/600x800', url: '#tile-a', alt: 'Placeholder tile A' }
const TILE_B = { src: 'https://placehold.co/600x800/222/fff', url: '#tile-b', alt: 'Placeholder tile B' }
const TILE_C = { src: 'https://placehold.co/600x800/555/fff', url: '#tile-c', alt: 'Placeholder tile C' }
const TILE_D = { src: 'https://placehold.co/600x800/888/fff', url: '#tile-d', alt: 'Placeholder tile D' }

const meta: Meta<typeof SeImageTiles> = {
  title: 'Components/SeImageTiles',
  component: SeImageTiles,
}

export default meta

type Story = StoryObj<typeof SeImageTiles>

export const TwoTiles: Story = {
  args: {
    tiles: [TILE_A, TILE_B],
  },
}

export const ThreeTiles: Story = {
  args: {
    tiles: [TILE_A, TILE_B, TILE_C],
  },
}

export const FourTiles: Story = {
  args: {
    tiles: [TILE_A, TILE_B, TILE_C, TILE_D],
  },
}
