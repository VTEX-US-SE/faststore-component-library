import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeBanner } from '@vtex-us-se/ui'
import { MobileOverlayTextPosition, OverlayTextPos, TextAlignment, TextPosition } from '@vtex-us-se/components'

// Storybook-only placeholder fixtures — not real VTEX/Thumbor asset URLs.
const PLACEHOLDER_IMAGE = { src: 'https://placehold.co/1440x464', alt: 'Placeholder banner image' }

const meta: Meta<typeof SeBanner> = {
  title: 'Components/SeBanner',
  component: SeBanner,
}

export default meta

type Story = StoryObj<typeof SeBanner>

export const FullModeWithCta: Story = {
  args: {
    isFullModeStyle: true,
    textPosition: TextPosition.LEFT,
    overlayTextPos: OverlayTextPos.LEFT,
    textAlignment: TextAlignment.LEFT,
    textMode: 'html',
    mobileOverlayTextPos: MobileOverlayTextPosition.BOTTOM,
    title: 'Nueva colección',
    subtitle: 'Descubrí los lanzamientos de la temporada',
    image: PLACEHOLDER_IMAGE,
    link: { show: true, text: 'Ver más', url: '#', linkTargetBlank: false },
  },
}

export const ImageWithText: Story = {
  args: {
    isFullModeStyle: true,
    textPosition: TextPosition.LEFT,
    overlayTextPos: OverlayTextPos.LEFT,
    textAlignment: TextAlignment.LEFT,
    textMode: 'html',
    mobileOverlayTextPos: MobileOverlayTextPosition.BOTTOM,
    title: 'Click en toda la imagen',
    subtitle: 'Sin CTA visible — toda la imagen navega al link',
    image: PLACEHOLDER_IMAGE,
    link: { show: false, text: '', url: '#', linkTargetBlank: false },
  },
}
