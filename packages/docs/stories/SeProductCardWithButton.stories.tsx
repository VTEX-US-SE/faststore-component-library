import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeProductCardWithButton } from '@vtex-us-se/ui'

// Storybook-only placeholder fixture — not real VTEX/Thumbor asset or catalog data.
const PLACEHOLDER_PRODUCT = {
  name: 'Placeholder Product Name',
  href: '#product',
  image: { src: 'https://placehold.co/600x600', alt: 'Placeholder product image' },
  price: { current: 79.9, listPrice: 99.9, currencyCode: 'USD', currencyLocale: 'en-US' },
}

const meta: Meta<typeof SeProductCardWithButton> = {
  title: 'Components/SeProductCardWithButton',
  component: SeProductCardWithButton,
}

export default meta

type Story = StoryObj<typeof SeProductCardWithButton>

export const Default: Story = {
  args: {
    product: PLACEHOLDER_PRODUCT,
    buttonLabel: 'Choose option',
  },
}

export const WithoutDiscount: Story = {
  args: {
    product: { ...PLACEHOLDER_PRODUCT, price: { current: 79.9, currencyCode: 'USD', currencyLocale: 'en-US' } },
    buttonLabel: 'Choose option',
  },
}

export const OutOfStock: Story = {
  args: {
    product: PLACEHOLDER_PRODUCT,
    buttonLabel: 'Choose option',
    outOfStock: true,
  },
}
