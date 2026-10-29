import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeProductReviews } from '@vtex-us-se/ui'
import type { SeProductReview } from '@vtex-us-se/components'

// Storybook-only placeholder fixtures.
const reviews: SeProductReview[] = [
  { id: '1', rating: 5, title: 'Great fit', text: 'True to size and comfortable all day.', author: 'Reviewer A', date: '2026-09-12' },
  { id: '2', rating: 3, title: 'Okay', text: 'Nice fabric, the color was lighter than expected.', author: 'Reviewer B', date: '2026-08-02' },
  { id: '3', rating: 4, text: 'Would buy again.', author: 'Reviewer C', date: '2026-10-01' },
]

const meta: Meta<typeof SeProductReviews> = {
  title: 'Components/SeProductReviews',
  component: SeProductReviews,
}

export default meta

type Story = StoryObj<typeof SeProductReviews>

export const Default: Story = {
  args: {},
}

export const WithReviews: Story = {
  args: { reviews },
}
