import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeRequestToBuy } from '@vtex-us-se/ui/b2b'

// NOTE: this component calls a GraphQL mutation (useLazyQuery_unstable from
// @faststore/core/experimental) on submit. That hook's real implementation may need a GraphQL
// client provider that a real FastStore project's app-shell injects and Storybook doesn't set up
// — the form renders fine here, but submitting it hasn't been verified end-to-end in isolation.

const meta: Meta<typeof SeRequestToBuy> = {
  title: 'Components/SeRequestToBuy',
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
