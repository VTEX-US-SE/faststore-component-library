import type { Decorator } from '@storybook/react-vite'
import { setMockSignedIn } from '../.storybook/mocks/faststore-core-experimental'

// The session mock is module-global, so every B2B story sets it explicitly rather than
// inheriting whatever the previously viewed story left behind.
export const signedIn: Decorator = (Story) => {
  setMockSignedIn(true)
  return <Story />
}

export const signedOut: Decorator = (Story) => {
  setMockSignedIn(false)
  return <Story />
}
