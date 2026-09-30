import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeGridContent } from '@vtex-us-se/ui'
import type { SeGridContentItem } from '@vtex-us-se/components'

// Storybook-only placeholder fixtures — not real VTEX/Thumbor asset URLs.
const PLACEHOLDER_IMAGE = (seed: string) => `https://placehold.co/640x800?text=${seed}`

const items: SeGridContentItem[] = [
  {
    eyebrow: 'Category',
    title: 'Paper & Specialty Products',
    image: PLACEHOLDER_IMAGE('Paper'),
    href: '#',
    ctaLabel: 'Shop Now',
    secondaryHref: '#',
    secondaryCtaLabel: 'View Featured Products',
  },
  {
    eyebrow: 'Category',
    title: 'Graphic Solutions',
    image: PLACEHOLDER_IMAGE('Graphics'),
    href: '#',
    ctaLabel: 'Shop Now',
    secondaryHref: '#',
    secondaryCtaLabel: 'View Featured Products',
  },
  {
    eyebrow: 'Category',
    title: 'Sign & Display',
    image: PLACEHOLDER_IMAGE('Sign'),
    href: '#',
    ctaLabel: 'Shop Now',
    secondaryHref: '#',
    secondaryCtaLabel: 'View Featured Products',
  },
  {
    eyebrow: 'Category',
    title: 'Packaging Solutions',
    image: PLACEHOLDER_IMAGE('Packaging'),
    href: '#',
    ctaLabel: 'Shop Now',
    secondaryHref: '#',
    secondaryCtaLabel: 'View Featured Products',
  },
]

const meta: Meta<typeof SeGridContent> = {
  title: 'Components/SeGridContent',
  component: SeGridContent,
}

export default meta

type Story = StoryObj<typeof SeGridContent>

export const Default: Story = {
  args: {
    items,
  },
}

export const WithBanner: Story = {
  args: {
    items,
    bannerImage: {
      src: 'https://placehold.co/1440x300?text=Banner',
      alt: 'Placeholder promotional banner',
    },
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}
