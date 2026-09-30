import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeLearnMoreSection } from '@vtex-us-se/ui'
import type { SeLearnMoreSectionBlurb } from '@vtex-us-se/components'

// Storybook-only placeholder fixture — not a real VTEX/Thumbor asset URL.
const PLACEHOLDER_IMAGE = { src: 'https://placehold.co/800x900', alt: 'Placeholder illustrative image' }

const blurbs: SeLearnMoreSectionBlurb[] = [
  {
    icon: '📦',
    title: 'Deep Inventory & Fast Delivery',
    description:
      'Our national distribution network and regional warehouses ensure fast, reliable service wherever you operate.',
  },
  {
    icon: '💡',
    title: 'Specialized Product Knowledge',
    description:
      'Our dedicated teams understand the unique demands of our customers, empowering your business with the right materials and expertise.',
  },
  {
    icon: '🌐',
    title: 'Local Service, Global Strength',
    description:
      'Backed by a global network of partners, we bring world-class brands together with local responsiveness.',
  },
]

const meta: Meta<typeof SeLearnMoreSection> = {
  title: 'Components/SeLearnMoreSection',
  component: SeLearnMoreSection,
}

export default meta

type Story = StoryObj<typeof SeLearnMoreSection>

export const Default: Story = {
  args: {
    eyebrow: 'Why Choose Us',
    heading: 'Trusted Expertise. National Reach. Local Commitment.',
    description:
      'Strong relationships are the foundation of everything we do. Our customers know they can depend on us for expertise, reliability, and a genuine commitment to their success.',
    blurbs,
    image: PLACEHOLDER_IMAGE,
  },
}

export const WithoutImage: Story = {
  args: {
    eyebrow: 'Why Choose Us',
    heading: 'Trusted Expertise. National Reach. Local Commitment.',
    description: 'A text-only variant with no image column.',
    blurbs,
  },
}

export const MinimalContent: Story = {
  args: {
    heading: 'Learn more about what we do',
  },
}
