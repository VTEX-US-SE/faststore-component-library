import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeAssemblySet } from '@vtex-us-se/ui'

// NOTE: this component reads its data via useQuery_unstable and composes the set via
// useLazyQuery_unstable (both from @faststore/core/experimental), mocked here with fixture
// data (see .storybook/mocks/faststore-core-experimental.ts) — the real GraphQL round trip
// (server-side `assemblyOptions` field resolver + `seAddComposedSet` mutation) hasn't been
// verified end-to-end in isolation, only inside a real FastStore project.

const meta: Meta<typeof SeAssemblySet> = {
  title: 'Components/SeAssemblySet',
  component: SeAssemblySet,
}

export default meta

type Story = StoryObj<typeof SeAssemblySet>

export const Default: Story = {
  args: {
    skuId: 'storybook-parent-sku',
    hint: 'Pick {min} to {max} items ({selected} selected)',
    completeHint: "You're all set!",
    ctaLabel: 'Add to cart',
  },
}
