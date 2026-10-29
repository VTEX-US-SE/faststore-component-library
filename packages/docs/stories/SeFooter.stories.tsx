import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeFooter } from '@vtex-us-se/ui'
import type { SeFooterColumn } from '@vtex-us-se/components'

// Storybook-only placeholder fixtures — not real VTEX/Thumbor asset URLs.
const footerLinks: SeFooterColumn[] = [
  {
    sectionTitle: 'Shop',
    items: [
      { text: 'Women', url: '#women' },
      { text: 'Men', url: '#men' },
      { text: 'Kids', url: '#kids' },
      { text: 'Home', url: '#home' },
    ],
  },
  {
    sectionTitle: 'Help',
    items: [
      { text: 'Customer service', url: '#help' },
      { text: 'Shipping', url: '#shipping' },
      { text: 'Returns', url: '#returns' },
    ],
  },
  {
    sectionTitle: 'Company',
    items: [
      { text: 'About us', url: '#about' },
      { text: 'Careers', url: '#careers' },
      { text: 'Press', url: '#press' },
    ],
  },
  {
    sectionTitle: 'Members',
    items: [
      { text: 'Join for free and get early access to offers and new arrivals.' },
      { text: 'Join now', url: '#join' },
    ],
  },
]

const meta: Meta<typeof SeFooter> = {
  title: 'Components/SeFooter',
  component: SeFooter,
}

export default meta

type Story = StoryObj<typeof SeFooter>

export const Default: Story = {
  args: {
    footerLinks,
    logo: { src: 'https://placehold.co/160x48?text=Logo', alt: 'Placeholder logo', link: { url: '#' } },
    footerSocial: {
      title: 'Follow us',
      socialLinks: [
        { image: 'https://placehold.co/20x20/000/fff?text=A', alt: 'Network A', url: '#network-a' },
        { image: 'https://placehold.co/20x20/000/fff?text=B', alt: 'Network B', url: '#network-b' },
      ],
    },
    copyrightInfo: 'Placeholder copyright notice. All rights reserved.',
  },
}

export const WithIncentivesAndPayments: Story = {
  args: {
    ...Default.args,
    incentives: [
      { title: 'Free shipping', firstLineText: 'On orders over a minimum amount' },
      { title: 'Easy returns', firstLineText: 'Within 30 days' },
      { title: 'Secure payment', firstLineText: 'Encrypted checkout' },
    ],
    acceptedPaymentMethods: {
      title: 'We accept',
      methods: [
        { image: 'https://placehold.co/38x24?text=1', alt: 'Payment method 1' },
        { image: 'https://placehold.co/38x24?text=2', alt: 'Payment method 2' },
      ],
    },
  },
}
