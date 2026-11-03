import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeVideoHero } from '@vtex-us-se/ui'

// Storybook-only placeholder fixtures — not real VTEX/Thumbor asset URLs.
const PLACEHOLDER_POSTER = 'https://placehold.co/1440x810/555/fff?text=Poster'
const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

const meta: Meta<typeof SeVideoHero> = {
  title: 'Components/SeVideoHero',
  component: SeVideoHero,
}

export default meta

type Story = StoryObj<typeof SeVideoHero>

export const Default: Story = {
  args: {
    video: { src: SAMPLE_VIDEO, poster: PLACEHOLDER_POSTER, alt: 'A flower opening, in slow motion' },
    title: 'New arrivals',
    link: { text: 'Shop now', url: '#new-arrivals' },
  },
}

export const CaptionOverlay: Story = {
  args: {
    ...Default.args,
    subtitle: 'The season starts here',
    captionPosition: 'overlay',
    aspectRatio: '21:9',
  },
}

export const Vimeo: Story = {
  args: {
    video: { src: 'https://vimeo.com/1137413169', poster: PLACEHOLDER_POSTER, alt: 'Hero banner video' },
    title: 'New arrivals',
    link: { text: 'Shop now', url: '#new-arrivals' },
  },
}

export const YouTube: Story = {
  args: {
    video: { src: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', poster: PLACEHOLDER_POSTER, alt: 'Big Buck Bunny' },
    title: 'New arrivals',
    link: { text: 'Shop now', url: '#new-arrivals' },
  },
}

export const PosterOnly: Story = {
  args: {
    video: { poster: PLACEHOLDER_POSTER, alt: 'Placeholder poster' },
    title: 'New arrivals',
    link: { text: 'Shop now', url: '#new-arrivals' },
  },
}
