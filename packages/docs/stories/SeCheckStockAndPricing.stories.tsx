import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeCheckStockAndPricing } from '@vtex-us-se/ui/b2b'
import { signedIn, signedOut } from './b2bSession'

// Storybook mocks the SKU search and the stock simulation. Try Ref IDs "GLV" (GLV-100…GLV-103,
// GLV-102 out of stock) or "BOOT", or import a CSV with a refId,quantity header.
const meta: Meta<typeof SeCheckStockAndPricing> = {
  title: 'B2B/SeCheckStockAndPricing',
  component: SeCheckStockAndPricing,
}

export default meta

type Story = StoryObj<typeof SeCheckStockAndPricing>

export const SignedIn: Story = {
  decorators: [signedIn],
}

export const SignedOut: Story = {
  decorators: [signedOut],
}
