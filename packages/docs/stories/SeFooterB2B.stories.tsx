import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeFooterB2B } from '@vtex-us-se/ui/b2b'

// Storybook-only placeholder fixtures — not real client asset URLs.
const PLACEHOLDER_LOGO = 'https://placehold.co/140x36/061425/ffffff?text=Logo'
const icon = (text: string) => `https://placehold.co/24x24/ffffff/061425?text=${text}`

const links = (prefix: string) =>
  ['One', 'Two', 'Three', 'Four'].map((n) => ({ text: `${prefix} ${n}`, url: `#${prefix.toLowerCase()}-${n}` }))

const meta: Meta<typeof SeFooterB2B> = {
  title: 'B2B/SeFooterB2B',
  component: SeFooterB2B,
}

export default meta

type Story = StoryObj<typeof SeFooterB2B>

export const Default: Story = {
  args: {
    columns: [
      { title: 'Company', links: links('Company') },
      { title: 'Account', links: links('Account') },
      { title: 'Support', links: links('Support') },
      { title: 'Legal', links: links('Legal') },
    ],
    newsletter: {
      title: 'Subscribe to Newsletter',
      text: 'Sign up for exclusive updates, new arrivals & insider only discounts',
      placeholder: 'Your Email ID',
    },
    socialLinks: [
      { icon: icon('in'), alt: 'LinkedIn', url: '#linkedin' },
      { icon: icon('X'), alt: 'X', url: '#x' },
      { icon: icon('yt'), alt: 'YouTube', url: '#youtube' },
    ],
    footerBottomBar: {
      logo: { src: PLACEHOLDER_LOGO, alt: 'Store logo', link: { url: '#', title: 'Home' } },
      contactCopyright: { contact: '1-800-555-0100', copyright: '© 2026 Store. All rights reserved.' },
    },
  },
}
