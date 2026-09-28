import { parseAttachment, type RawAttachment } from './parseComposition'

export interface VtexApiConfig {
  storeId: string
  environment?: string
  /**
   * Overrides the Checkout base URL used to compose sets. Defaults to hitting the VTEX
   * platform directly (`https://{storeId}.{environment}.com.br`). Pass this when the
   * consuming project proxies `/api/checkout/*` through its own storefront domain (keeps
   * checkout cookies same-origin) and that proxy should be used instead.
   */
  checkoutBaseUrl?: string
}

interface SkuRoot {
  attachments?: RawAttachment[]
}

interface AssemblyItemRoot {
  skuId: string
}

interface SkuLoaderContext {
  loaders?: {
    skuLoader?: { load: (key: string) => Promise<unknown> }
  }
}

export interface SeComposedSetInput {
  orderFormId?: string | null
  parentSku: string
  sets: number
  items: Array<{ skuId: string; quantity: number; seller: string }>
}

interface OrderFormItem {
  id: string
  quantity: number
  parentItemIndex: number | null
}

interface OrderForm {
  orderFormId: string
  value: number
  items: OrderFormItem[]
  itemMetadata?: {
    items?: Array<{ id: string; assemblyOptions?: Array<{ id: string }> }>
  }
  messages?: Array<{ text?: string }>
}

/** Highest number of copies a single call will compose -- each costs two requests. */
const MAX_SETS = 10

async function sendOrderForm(
  base: string,
  method: 'POST' | 'PUT',
  path: string,
  body: unknown,
): Promise<OrderForm> {
  const response = await fetch(`${base}/api/checkout/pub/orderForm${path}`, {
    method,
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null)

    throw new Error(detail?.error?.message ?? `Checkout returned ${response.status}`)
  }

  return response.json()
}

function messagesFrom(orderForm: OrderForm): string[] {
  return (orderForm.messages ?? []).map((message) => message.text).filter((text): text is string => Boolean(text))
}

/**
 * The `assemblyId` Checkout expects, read off the orderForm rather than built from catalog
 * data: the real id is `{attachmentName}_{groupName}`, and that shape belongs to VTEX.
 */
function assemblyIdFor(orderForm: OrderForm, parentSku: string) {
  return orderForm.itemMetadata?.items?.find((item) => item.id === parentSku)?.assemblyOptions?.[0]?.id
}

/**
 * Index of the parent line that has no children pointing at it yet -- the one just added.
 * Composed parents are excluded by scanning every item's `parentItemIndex`.
 */
function uncomposedParentIndex(orderForm: OrderForm, parentSku: string) {
  const composed = new Set(
    orderForm.items.map((item) => item.parentItemIndex).filter((index): index is number => index !== null),
  )

  return orderForm.items.findIndex(
    (item, index) => item.id === parentSku && item.parentItemIndex === null && !composed.has(index),
  )
}

/**
 * Factory instead of a plain resolver map: reads `storeId`/`environment`/`checkoutBaseUrl`
 * from config rather than a relative import to the consuming project's own
 * discovery.config.js, which can't resolve once this code is published as a standalone
 * package. Returns the full resolver map (spanning `StoreProduct`, `Mutation` and
 * `SeAssemblyItem`) rather than a single field resolver -- see the CLI's `resolverShape:
 * "map"` in assemblySet.meta.json.
 */
export function createAssemblySetResolver(config: VtexApiConfig) {
  const environment = config.environment ?? 'vtexcommercestable'

  if (!config.checkoutBaseUrl) {
    console.warn(
      '[@vtex-us-se/resolvers] createAssemblySetResolver: no checkoutBaseUrl configured — composing a set will ' +
        `call the VTEX platform host directly (https://${config.storeId}.${environment}.com.br). If this project ` +
        "proxies /api/checkout/* through its own storefront domain (common, to keep checkout cookies same-origin), " +
        'pass that domain as checkoutBaseUrl instead.',
    )
  }

  const checkoutBase = config.checkoutBaseUrl ?? `https://${config.storeId}.${environment}.com.br`

  /**
   * Adds `sets` copies of a composed set to an orderForm.
   *
   * Each copy is its own parent line, composed individually. One parent with scaled
   * children is not equivalent: Checkout rejects a composition whose quantities are not a
   * multiple of the parent quantity (`CHK0023`), and the per-item and per-group maxima are
   * absolute per line, so scaling to match trips `itemMaxQuantityLimitReached` instead.
   *
   * Sequential because each call returns new orderForm state, and copy N's parent index
   * depends on the lines copy N-1 added.
   */
  async function addComposedSet({ orderFormId, parentSku, sets, items }: SeComposedSetInput) {
    if (items.length === 0) {
      throw new Error('Nothing selected for this set.')
    }

    const copies = Math.min(Math.max(sets, 1), MAX_SETS)
    let orderForm = orderFormId ? ({ orderFormId } as OrderForm) : await sendOrderForm(checkoutBase, 'POST', '', {})

    for (let copy = 0; copy < copies; copy++) {
      const withParent = await sendOrderForm(checkoutBase, 'POST', `/${orderForm.orderFormId}/items?sc=1`, {
        orderItems: [{ id: parentSku, quantity: 1, seller: '1' }],
      })

      const assemblyId = assemblyIdFor(withParent, parentSku)
      const parentIndex = uncomposedParentIndex(withParent, parentSku)

      if (!assemblyId || parentIndex < 0) {
        throw new Error('This set is not configured as an assembly in Checkout.')
      }

      orderForm = await sendOrderForm(
        checkoutBase,
        'POST',
        `/${withParent.orderFormId}/items/${parentIndex}/assemblyOptions/${encodeURIComponent(assemblyId)}?sc=1`,
        {
          composition: {
            items: items.map(({ skuId, quantity, seller }) => ({ id: skuId, quantity, seller })),
          },
          inputValues: {},
        },
      )
    }

    return {
      orderFormId: orderForm.orderFormId,
      value: orderForm.value,
      messages: messagesFrom(orderForm),
    }
  }

  return {
    StoreProduct: {
      assemblyOptions: (root: SkuRoot) =>
        (root.attachments ?? [])
          .map((attachment) => {
            const groups = parseAttachment(attachment)

            if (groups.length === 0) {
              return null
            }

            return {
              id: attachment.name ?? String(attachment.id ?? ''),
              name: attachment.name ?? '',
              required: attachment.required ?? attachment.isRequired ?? false,
              groups,
            }
          })
          .filter(Boolean),
    },

    Mutation: {
      seAddComposedSet: (_root: unknown, { data }: { data: SeComposedSetInput }) => addComposedSet(data),
    },

    SeAssemblyItem: {
      product: async ({ skuId }: AssemblyItemRoot, _args: unknown, ctx: SkuLoaderContext) => {
        try {
          return (await ctx.loaders?.skuLoader?.load(skuId)) ?? null
        } catch {
          return null
        }
      },
    },
  }
}
