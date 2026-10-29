import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeAddressSelector } from '@vtex-us-se/ui/b2b'
import { signedIn, signedOut } from './b2bSession'

// Storybook mocks the query with four addresses (three "commercial"). On first load the mock
// session has no postal code, so the default address gets applied — like a real first visit.
// Addresses are cached per shopper in localStorage (`seShopperAddressesCache`).
const meta: Meta<typeof SeAddressSelector> = {
  title: 'B2B/SeAddressSelector',
  component: SeAddressSelector,
}

export default meta

type Story = StoryObj<typeof SeAddressSelector>

export const SignedIn: Story = {
  decorators: [signedIn],
}

export const AllAddressTypes: Story = {
  decorators: [signedIn],
  args: { addressType: '' },
}

export const SignedOut: Story = {
  decorators: [signedOut],
}
