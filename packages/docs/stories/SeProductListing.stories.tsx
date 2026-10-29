import type { Meta, StoryObj } from '@storybook/react-vite'
// Source-copy only, so not exported from @vtex-us-se/ui: imported from its source folder.
import { SeProductListing } from '../../ui/src/b2c/SeProductListing/SeProductListing'

// The page context and the native gallery are mocked (.storybook/mocks/faststore-core.tsx): the
// story shows the title and the restyling, not real facets, sorting or pagination.
const meta: Meta<typeof SeProductListing> = {
  title: 'Components/SeProductListing',
  component: SeProductListing,
}

export default meta

type Story = StoryObj<typeof SeProductListing>

export const Default: Story = {
  args: {},
}

export const ThreeColumnsSquareWithGaps: Story = {
  args: {
    columns: { mobile: 2, desktop: 3 },
    imageAspectRatio: '1:1',
    edgeToEdge: false,
    uppercase: false,
    title: 'Custom title',
  },
}
