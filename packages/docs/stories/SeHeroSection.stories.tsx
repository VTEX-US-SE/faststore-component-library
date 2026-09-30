import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeHeroSection } from '@vtex-us-se/ui'

// Storybook-only placeholder fixture — not a real VTEX/Thumbor asset URL.
const PLACEHOLDER_IMAGE = { src: 'https://placehold.co/1600x900', alt: 'Placeholder hero background' }

const meta: Meta<typeof SeHeroSection> = {
  title: 'Components/SeHeroSection',
  component: SeHeroSection,
}

export default meta

type Story = StoryObj<typeof SeHeroSection>

export const Default: Story = {
  args: {
    title: 'Your Leading Distribution Partner',
    description:
      'We provide a comprehensive range of products and solutions. With deep industry expertise and value-added services, we help businesses deliver their ideal product.',
    cta: { text: 'LEARN MORE', href: '#learnmore', linkTargetBlank: false },
  },
}

export const WithBackgroundImage: Story = {
  args: {
    title: 'Your Leading Distribution Partner',
    description:
      'We provide a comprehensive range of products and solutions. With deep industry expertise and value-added services, we help businesses deliver their ideal product.',
    backgroundImage: PLACEHOLDER_IMAGE,
    cta: { text: 'LEARN MORE', href: '#learnmore', linkTargetBlank: false },
  },
}

export const WithoutCta: Story = {
  args: {
    title: 'Your Leading Distribution Partner',
    description: 'A focused message with no call-to-action button.',
  },
}
