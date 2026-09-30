import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeCardsCarousel } from '@vtex-us-se/ui'

// Storybook-only placeholder fixtures — not real VTEX/Thumbor asset URLs.
const CARD_ONE = {
  image: 'https://placehold.co/480x480/2c3e50/ffffff?text=Card+1',
  title: 'Colección Verano',
  description: 'Prendas livianas para los días más calurosos.',
  button: 'Ver más',
  link: '#',
}

const CARD_TWO = {
  image: 'https://placehold.co/480x480/8e44ad/ffffff?text=Card+2',
  title: 'Accesorios',
  description: 'Completá tu look con nuestra selección de accesorios.',
  button: 'Comprar ahora',
  link: '#',
}

const CARD_THREE = {
  image: 'https://placehold.co/480x480/16a085/ffffff?text=Card+3',
  title: 'Calzado',
  description: 'Comodidad y estilo para cada ocasión.',
  button: 'Descubrir',
  link: '#',
}

const meta: Meta<typeof SeCardsCarousel> = {
  title: 'Components/SeCardsCarousel',
  component: SeCardsCarousel,
}

export default meta

type Story = StoryObj<typeof SeCardsCarousel>

export const ThreeOrMoreCards: Story = {
  args: {
    title: 'Explorá nuestras colecciones',
    banners: [CARD_ONE, CARD_TWO, CARD_THREE],
  },
}

export const FewerThanThreeCards: Story = {
  args: {
    title: 'Destacados de la temporada',
    banners: [CARD_ONE, CARD_TWO],
  },
}

export const SingleCard: Story = {
  args: {
    title: 'Lo más nuevo',
    banners: [CARD_ONE],
  },
}
