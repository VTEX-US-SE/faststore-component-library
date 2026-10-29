/**
 * Drops CMS items that have no image yet. Editors often add an empty row before uploading
 * its image; rendering it would leave a broken cell in the grid.
 */
export function filterItemsWithImage<T extends { image?: string | null }>(
  items: T[] | null | undefined
): T[] {
  return (items ?? []).filter((item) => Boolean(item?.image))
}
