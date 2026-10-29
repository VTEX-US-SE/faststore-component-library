import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeAddToPurchaseList } from '@vtex-us-se/ui/b2b'
import { signedIn, signedOut } from './b2bSession'

// Storybook keeps the lists in memory (shared with the SePurchaseLists story, reset on reload).
// On a PDP the section saves the product's selected SKU (the mocked usePDP's); `products` here
// saves two SKUs of the SePurchaseLists fixtures instead, so they show by name there.
const meta: Meta<typeof SeAddToPurchaseList> = {
  title: 'B2B/SeAddToPurchaseList',
  component: SeAddToPurchaseList,
  args: { listsUrl: '?path=/story/b2b-sepurchaselists--signed-in' },
}

export default meta

type Story = StoryObj<typeof SeAddToPurchaseList>

export const OnAPdp: Story = {
  decorators: [signedIn],
  args: { quantity: 2 },
}

export const WithProducts: Story = {
  decorators: [signedIn],
  args: {
    products: [
      { skuId: 'glv100', quantity: 10 },
      { skuId: 'boot200', quantity: 2 },
    ],
  },
}

export const SignedOut: Story = {
  decorators: [signedOut],
}
