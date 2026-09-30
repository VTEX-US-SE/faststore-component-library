import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeMegaMenu } from '@vtex-us-se/ui'
import type { MegaMenuItem } from '@vtex-us-se/components'

// Storybook-only mock data — not real VTEX catalog categories.
const MENU_ITEMS: MegaMenuItem[] = [
  {
    text: 'Apparel & Accessories',
    url: '/apparel---accessories',
    level1: [
      {
        text: 'Apparel & Accessories',
        url: '/apparel---accessories',
        level2: [
          {
            text: 'Accessories',
            url: '/apparel---accessories/accessories',
            level3: [
              { text: 'Backpack', url: '/apparel---accessories/accessories/backpack' },
              { text: 'Bag', url: '/apparel---accessories/accessories/bag' },
              { text: 'Belt', url: '/apparel---accessories/accessories/belt' },
              { text: 'Watch', url: '/apparel---accessories/accessories/watch' },
            ],
          },
          {
            text: 'Apparel',
            url: '/apparel---accessories/apparel',
            level3: [
              { text: 'Jacket', url: '/apparel---accessories/apparel/jacket' },
              { text: 'Scarf', url: '/apparel---accessories/apparel/scarf' },
              { text: 'Shirt', url: '/apparel---accessories/apparel/shirt' },
            ],
          },
          {
            text: 'Footwear',
            url: '/apparel---accessories/footwear',
            level3: [
              { text: 'Boot', url: '/apparel---accessories/footwear/boot' },
              { text: 'Sneakers', url: '/apparel---accessories/footwear/sneakers' },
            ],
          },
        ],
      },
      {
        text: 'Furniture',
        url: '/furniture',
        level2: [
          {
            text: 'Furniture',
            url: '/furniture/furniture',
            level3: [
              { text: 'Chairs', url: '/furniture/furniture/chairs' },
              { text: 'Sofas', url: '/furniture/furniture/sofas' },
              { text: 'Tables', url: '/furniture/furniture/tables' },
            ],
          },
        ],
      },
    ],
  },
  {
    text: 'Electronics',
    url: '/electronics',
    level1: [
      {
        text: 'Electronics',
        url: '/electronics',
        level2: [
          {
            text: 'Electronics',
            url: '/electronics',
            level3: [
              { text: 'Camera', url: '/electronics/camera' },
              { text: 'Headphones', url: '/electronics/headphones' },
              { text: 'Speaker', url: '/electronics/speaker' },
              { text: 'Television', url: '/electronics/television' },
            ],
          },
        ],
      },
    ],
  },
  {
    text: 'Seasonals',
    url: '/seasonal',
    level1: [
      {
        text: 'Christmas',
        url: '/seasonal/christmas',
        level2: [
          { text: 'Lights', url: '/seasonal/christmas/lights' },
          { text: 'Decor', url: '/seasonal/christmas/decor' },
        ],
      },
      { text: 'Halloween', url: '/seasonal/halloween' },
      { text: 'Valentine', url: '/seasonal/valentine' },
    ],
  },
  // A menu item with no nested categories renders as a plain link, on desktop and mobile.
  { text: 'Sale', url: '/sale' },
]

const LOGO = {
  src: 'https://placehold.co/140x60?text=Logo',
  alt: 'Store logo',
  link: '/',
}

const meta: Meta<typeof SeMegaMenu> = {
  title: 'Components/SeMegaMenu',
  component: SeMegaMenu,
  parameters: {
    // The mobile drawer only becomes reachable via FastStore's own navbar hamburger button
    // ([data-fs-navbar-button-menu]), which doesn't exist in Storybook — resize the viewport
    // below 1280px and use the addon toolbar's viewport controls to inspect the drawer markup,
    // or drive `useMegaMenuMobileNavigation` directly in a custom render for that case.
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof SeMegaMenu>

export const Default: Story = {
  args: {
    menuItems: MENU_ITEMS,
    logo: LOGO,
  },
}

export const WithoutLogo: Story = {
  args: {
    menuItems: MENU_ITEMS,
  },
}

export const FlatMenu: Story = {
  args: {
    menuItems: [
      { text: 'Home', url: '/' },
      { text: 'New Arrivals', url: '/new-arrivals' },
      { text: 'Sale', url: '/sale' },
    ],
    logo: LOGO,
  },
}
