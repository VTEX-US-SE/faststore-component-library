import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeCategoryBanners } from '@vtex-us-se/ui/b2b'

// Storybook-only placeholder fixtures — not real client asset URLs.
const banner = (text: string, color: string) => `https://placehold.co/600x300/${color}/${color}?text=${text}`

const meta: Meta<typeof SeCategoryBanners> = {
  title: 'B2B/SeCategoryBanners',
  component: SeCategoryBanners,
}

export default meta

type Story = StoryObj<typeof SeCategoryBanners>

export const Default: Story = {
  args: {
    bannerList: [
      { title: 'Safety', text: 'Gloves, eyewear and more', linkText: 'Shop Now', url: '#safety', banner: banner('Safety', '1f4e79') },
      { title: 'Tools', text: 'Power and hand tools', linkText: 'Shop Now', url: '#tools', banner: banner('Tools', '7a3e12') },
      { title: 'Packaging', text: 'Boxes, tape, labels', linkText: 'Shop Now', url: '#packaging', banner: banner('Packaging', '245c3a') },
    ],
  },
}
