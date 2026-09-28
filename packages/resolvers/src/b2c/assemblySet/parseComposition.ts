export interface AssemblyItem {
  skuId: string
  minQuantity: number
  maxQuantity: number
  initialQuantity: number
  priceTable: string | null
}

export interface AssemblyGroup {
  name: string
  minQuantity: number
  maxQuantity: number
  items: AssemblyItem[]
}

/**
 * A catalog attachment as it arrives from the search layer. VTEX returns two
 * different shapes for the same data and which one you get depends on the
 * endpoint, so both are accepted:
 *
 * - Intelligent Search: `fields: [{ field_name, domain_values }]`
 * - legacy catalog:     `domainValues` -- a JSON *string* of
 *   `[{ FieldName, MaxCaracters, DomainValues }]`
 */
export interface RawAttachment {
  id?: number | string
  name?: string
  required?: boolean
  isRequired?: boolean
  domainValues?: string
  fields?: Array<{ field_name?: string; domain_values?: string }>
}

const GROUP_RE = /^\[(\d+)-(\d+)\]/
const ITEM_RE = /^#([^[]+)\[(\d+)-(\d+)\]\[(\d+)\](.*)$/

/**
 * Normalises either attachment shape into `{ fieldName, composition }` pairs.
 * Unparseable input yields an empty list rather than throwing -- a malformed
 * attachment should hide the set, not break the whole product query.
 *
 * Exported because every catalog attachment arrives in these same two shapes,
 * not just assembly options.
 */
export function readFields(attachment: RawAttachment): Array<{ fieldName: string; composition: string }> {
  if (Array.isArray(attachment.fields)) {
    return attachment.fields
      .filter((field) => field?.domain_values)
      .map((field) => ({
        fieldName: field.field_name ?? '',
        composition: field.domain_values as string,
      }))
  }

  if (typeof attachment.domainValues === 'string') {
    try {
      const parsed = JSON.parse(attachment.domainValues)

      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed
        .filter((entry) => entry?.DomainValues)
        .map((entry) => ({
          fieldName: entry.FieldName ?? '',
          composition: entry.DomainValues as string,
        }))
    } catch {
      return []
    }
  }

  return []
}

/**
 * Parses one VTEX composition string into a group.
 *
 * Format: `[groupMin-groupMax]#sku[min-max][initial]priceTable;#sku[...]...`
 * e.g. `[1-4]#1[0-4][0];#4373[0-4][0];`
 *
 * The price table is optional and a trailing `;` is tolerated -- the Assembly
 * Options app emits both variants.
 */
export function parseComposition(name: string, composition: string): AssemblyGroup | null {
  const groupMatch = GROUP_RE.exec(composition)

  if (!groupMatch) {
    return null
  }

  const items = composition
    .slice(groupMatch[0].length)
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment): AssemblyItem | null => {
      const match = ITEM_RE.exec(segment)

      if (!match) {
        return null
      }

      return {
        skuId: match[1] as string,
        minQuantity: Number(match[2]),
        maxQuantity: Number(match[3]),
        initialQuantity: Number(match[4]),
        priceTable: match[5] ? match[5] : null,
      }
    })
    .filter((item): item is AssemblyItem => item !== null)

  if (items.length === 0) {
    return null
  }

  return {
    name,
    minQuantity: Number(groupMatch[1]),
    maxQuantity: Number(groupMatch[2]),
    items,
  }
}

/**
 * Turns a raw catalog attachment into its groups. Returns an empty array for
 * attachments that carry no parseable composition, which is how ordinary
 * (non-assembly) attachments are filtered out.
 */
export function parseAttachment(attachment: RawAttachment): AssemblyGroup[] {
  return readFields(attachment)
    .map(({ fieldName, composition }) => parseComposition(fieldName, composition))
    .filter((group): group is AssemblyGroup => group !== null)
}
