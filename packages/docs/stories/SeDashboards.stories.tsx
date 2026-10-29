import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeDashboards } from '@vtex-us-se/ui/b2b'
import { signedIn, signedOut } from './b2bSession'

// Storybook mocks both queries with fixed fixtures; click "Low Stock Alerts" to open the drawer.
// The tiles cache per shopper in localStorage — clear `seDashboardSummaryCache` / `seLowStockCache`
// after changing the fixtures.
const meta: Meta<typeof SeDashboards> = {
  title: 'B2B/SeDashboards',
  component: SeDashboards,
}

export default meta

type Story = StoryObj<typeof SeDashboards>

export const SignedIn: Story = {
  decorators: [signedIn],
}

export const SignedOut: Story = {
  decorators: [signedOut],
}
