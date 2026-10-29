import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeRecentOrdersSpendOverview } from '@vtex-us-se/ui/b2b'
import { signedIn, signedOut } from './b2bSession'

// Storybook mocks both queries with fixed fixtures. The component caches per shopper in
// localStorage — clear `seRecentOrdersCache` / `seSpendOverviewCache` after changing them.
const meta: Meta<typeof SeRecentOrdersSpendOverview> = {
  title: 'B2B/SeRecentOrdersSpendOverview',
  component: SeRecentOrdersSpendOverview,
}

export default meta

type Story = StoryObj<typeof SeRecentOrdersSpendOverview>

export const SignedIn: Story = {
  decorators: [signedIn],
  args: {
    recentOrdersTitle: 'Recent Orders',
    viewAllLabel: 'View All',
    ordersUrl: '/pvt/account/orders',
    ordersLimit: 5,
    spendOverviewTitle: 'Spend Overview (MTD)',
  },
}

export const SignedOut: Story = {
  decorators: [signedOut],
}
