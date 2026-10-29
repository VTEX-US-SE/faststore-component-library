import type { Meta, StoryObj } from '@storybook/react-vite'
import { SePurchaseLists } from '@vtex-us-se/ui/b2b'
import { signedIn, signedOut } from './b2bSession'

// Storybook keeps the lists in memory (reset on reload): one owned list, and one shared by a
// colleague (so rename / share / delete are hidden). Add items by Ref ID: "GLV" or "BOOT".
const meta: Meta<typeof SePurchaseLists> = {
  title: 'B2B/SePurchaseLists',
  component: SePurchaseLists,
}

export default meta

type Story = StoryObj<typeof SePurchaseLists>

export const SignedIn: Story = {
  decorators: [signedIn],
}

export const SignedOut: Story = {
  decorators: [signedOut],
}
