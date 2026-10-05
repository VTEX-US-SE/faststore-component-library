import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeCustomShelfProduct } from '@vtex-us-se/ui/b2b'
import { signedIn, signedOut } from './b2bSession'

const meta: Meta<typeof SeCustomShelfProduct> = {
  title: 'B2B/SeCustomShelfProduct',
  component: SeCustomShelfProduct,
  decorators: [signedIn],
}

export default meta

type Story = StoryObj<typeof SeCustomShelfProduct>

export const SignedIn: Story = {
  args: { title: 'Recommended for your organization', numberOfItems: 6 },
}

/** Prices are login-gated: anonymous shoppers get "Login for price" instead. */
export const SignedOut: Story = { ...SignedIn, decorators: [signedOut] }
