import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeActionHubBulletinBoard } from '@vtex-us-se/ui/b2b'
import { signedIn, signedOut } from './b2bSession'

const meta: Meta<typeof SeActionHubBulletinBoard> = {
  title: 'B2B/SeActionHubBulletinBoard',
  component: SeActionHubBulletinBoard,
  decorators: [signedIn],
}

export default meta

type Story = StoryObj<typeof SeActionHubBulletinBoard>

export const Default: Story = {
  args: {
    actionHub: {
      title: 'Action Hub',
      actionList: [
        { text: 'Quick order', url: '#quick-order' },
        { text: 'Purchase lists', url: '#lists' },
        { text: 'Order history', url: '#orders' },
        { text: 'Request a quote', url: '#quote', newTab: true },
      ],
    },
    bulletinBoard: {
      title: 'Bulletin Board',
      items: [
        { title: 'New ordering portal', text: 'Faster checkout for repeat orders.', date: '2025-09-15', label: 'platform' },
        { title: 'Supplier price update', text: 'Adhesives pricing changes Oct 1.', date: '2025-09-10', label: 'supplier' },
        { title: 'Safety data sheets', text: 'Updated SDS for solvents.', date: '2025-09-02', label: 'compliance' },
        { title: 'New product line', text: 'Eco packaging now available.', date: '2025-08-28', label: 'product' },
      ],
    },
  },
}

/** Renders nothing outside a B2B session. */
export const NoB2bSession: Story = { ...Default, decorators: [signedOut] }
