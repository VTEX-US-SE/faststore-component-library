import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeRequestToBuy } from '@vtex-us-se/ui/b2b'

// Storybook mocks the mutation: any submission succeeds, except a company name of "fail".
const meta: Meta<typeof SeRequestToBuy> = {
  title: 'B2B/SeRequestToBuy',
  component: SeRequestToBuy,
}

export default meta

type Story = StoryObj<typeof SeRequestToBuy>

export const Default: Story = {
  args: {
    title: 'Request buyer access',
    description: "Fill out the form below and we'll get back to you.",
    ctaLabel: 'Request to Buy',
  },
}
