import type { Meta, StoryObj } from '@storybook/react-vite'
// Source-copy only, so not exported from @vtex-us-se/ui: imported from its source folder.
import { SeProductGalleryB2B } from '../../ui/src/b2b/SeProductGalleryB2B/SeProductGalleryB2B'
import { signedIn, signedOut } from './b2bSession'

// The native gallery is mocked (.storybook/mocks/faststore-core.tsx): it renders the overridden
// card over fixture products, not real facets, sorting or pagination. "View Options" opens the
// SKU matrix; "Add to Cart" logs the cart items to the console.
const meta: Meta<typeof SeProductGalleryB2B> = {
  title: 'B2B/SeProductGalleryB2B',
  component: SeProductGalleryB2B,
}

export default meta

type Story = StoryObj<typeof SeProductGalleryB2B>

export const SignedIn: Story = {
  decorators: [signedIn],
  args: { title: 'Safety Equipment' },
}

export const SignedOut: Story = {
  decorators: [signedOut],
  args: { title: 'Safety Equipment', loginUrl: '/login' },
}
