import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeCustomCrossSellingShelf } from '@vtex-us-se/ui/b2b'
import { signedIn } from './b2bSession'

// The real section reads the PDP context and queries cross-selling itself; the Storybook mock of
// `getOverriddenSection` only renders fixture products through the overridden card.
const meta: Meta<typeof SeCustomCrossSellingShelf> = {
  title: 'B2B/SeCustomCrossSellingShelf',
  component: SeCustomCrossSellingShelf,
  decorators: [signedIn],
}

export default meta

type Story = StoryObj<typeof SeCustomCrossSellingShelf>

export const Default: Story = {
  args: { title: 'People also saw', numberOfItems: 5, kind: 'view' },
}
