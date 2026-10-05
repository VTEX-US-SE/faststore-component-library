import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeValuePropCards } from '@vtex-us-se/ui'
import type { SeValuePropCardsItem } from '@vtex-us-se/components'

// Storybook-only placeholder fixture — not a real asset URL.
const PLACEHOLDER_ICON = 'https://placehold.co/32x32'

const cards: SeValuePropCardsItem[] = [
  { icon: PLACEHOLDER_ICON, title: 'Fast shipping', description: 'Orders ship the same day when placed before noon.' },
  { icon: PLACEHOLDER_ICON, title: 'Dedicated support', description: 'Talk to a specialist who knows your account.' },
  {
    icon: PLACEHOLDER_ICON,
    title: 'Flexible payment',
    description: 'Pay by invoice, card or credit line.',
    cta: { buttonText: 'Learn more', link: '#' },
  },
  { icon: PLACEHOLDER_ICON, title: 'Easy returns', description: 'Hassle-free returns within 30 days.' },
]

const meta: Meta<typeof SeValuePropCards> = {
  title: 'Components/SeValuePropCards',
  component: SeValuePropCards,
}

export default meta

type Story = StoryObj<typeof SeValuePropCards>

export const Default: Story = {
  args: { cards },
}

export const SingleCard: Story = {
  args: { cards: [cards[0]] },
}

export const WithIndexBadge: Story = {
  args: { cards, showIndexBadge: true },
}

export const FilteredByLocaleAndCluster: Story = {
  args: {
    locale: 'en-US',
    customerClass: 'VIP',
    cards: [
      ...cards.slice(0, 2),
      { title: 'Spanish-only card (hidden)', description: 'Not shown for en-US.', languagesToShow: 'es-MX' },
      { title: 'VIP-only card', description: 'Shown for the VIP cluster.', clustersToShow: 'VIP,Gold' },
    ],
  },
}
