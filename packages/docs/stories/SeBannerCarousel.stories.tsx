import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeBannerCarousel } from '@vtex-us-se/ui'

// Storybook-only placeholder fixtures — not real VTEX/Thumbor asset URLs.
const SLIDE_ONE = {
  image: 'https://placehold.co/1440x420/2c3e50/ffffff?text=Slide+1',
  alt: 'Placeholder banner slide 1',
  title: 'Nueva colección',
  text: 'Descubrí los lanzamientos de la temporada',
  linkText: 'Ver más',
  url: '#',
}

const SLIDE_TWO = {
  image: 'https://placehold.co/1440x420/8e44ad/ffffff?text=Slide+2',
  alt: 'Placeholder banner slide 2',
  title: 'Envío gratis',
  text: 'En compras superiores a $50.000',
  linkText: 'Comprar ahora',
  url: '#',
}

const SLIDE_THREE = {
  image: 'https://placehold.co/1440x420/16a085/ffffff?text=Slide+3',
  alt: 'Placeholder banner slide 3',
}

const meta: Meta<typeof SeBannerCarousel> = {
  title: 'Components/SeBannerCarousel',
  component: SeBannerCarousel,
}

export default meta

type Story = StoryObj<typeof SeBannerCarousel>

export const Default: Story = {
  args: {
    banners: [SLIDE_ONE, SLIDE_TWO, SLIDE_THREE],
    autoplay: true,
    autoplayDelay: 5000,
    showNavigation: true,
    showPagination: true,
  },
}

export const WithoutAutoplay: Story = {
  args: {
    banners: [SLIDE_ONE, SLIDE_TWO],
    autoplay: false,
    showNavigation: true,
    showPagination: true,
  },
}

export const SingleSlideNoControls: Story = {
  args: {
    banners: [SLIDE_ONE],
    autoplay: true,
    showNavigation: true,
    showPagination: true,
  },
}

export const ImagesOnly: Story = {
  args: {
    banners: [
      { image: SLIDE_THREE.image, alt: SLIDE_THREE.alt },
      { image: SLIDE_TWO.image, alt: SLIDE_TWO.alt },
    ],
    autoplay: false,
    showNavigation: true,
    showPagination: false,
  },
}
