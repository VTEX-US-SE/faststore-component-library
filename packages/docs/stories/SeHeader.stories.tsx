import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeHeader } from '@vtex-us-se/ui'

// Storybook-only placeholder fixture — not a real client asset URL.
const PLACEHOLDER_LOGO = 'https://placehold.co/180x44?text=Logo'

const meta: Meta<typeof SeHeader> = {
  title: 'Components/SeHeader',
  component: SeHeader,
}

export default meta

type Story = StoryObj<typeof SeHeader>

export const Default: Story = {
  args: {
    topbar: {
      leftText: 'Contact Us · New User? Request Login Here',
      rightItems: [{ label: 'English ▾' }, { label: 'Switch Region', href: '#region' }],
    },
    logo: { text: 'Store logo', href: '#', imageUrl: PLACEHOLDER_LOGO },
    search: { placeholder: 'Search', categories: [{ label: 'All' }, { label: 'Products' }] },
    account: { welcome: 'Welcome', guestLabel: 'Guest', loginLabel: 'LOGIN', loginHref: '#login', showAvatar: true },
  },
}

export const TextLogoNoTopbar: Story = {
  args: {
    logo: { text: 'Store name', href: '#' },
    search: { placeholder: 'Search products' },
    account: { loginLabel: 'LOGIN', showAvatar: false },
  },
}
