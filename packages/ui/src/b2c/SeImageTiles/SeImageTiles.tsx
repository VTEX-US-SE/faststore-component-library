import type { CSSProperties, HTMLAttributes } from 'react'
import type {
  ImageTile,
  SeImageTilesAspectRatio,
  SeImageTilesCaptionPosition,
  SeImageTilesColumns,
} from '@vtex-us-se/components'
import styles from './SeImageTiles.module.scss'

export interface SeImageTilesProps extends HTMLAttributes<HTMLDivElement> {
  /** 2 to 4 clickable image tiles, displayed side-by-side. */
  tiles: ImageTile[]
  /** `below` shows each tile's title and link label under its image. Defaults to `none`. */
  captionPosition?: SeImageTilesCaptionPosition
  /**
   * Fixed number of columns. When unset, every tile shares one row on desktop and the tiles
   * stack on mobile. When set, the grid keeps up to 2 columns on mobile.
   */
  columns?: SeImageTilesColumns
  /** Image aspect ratio, width:height. When unset, 3:4 on desktop and 4:3 on stacked mobile. */
  aspectRatio?: SeImageTilesAspectRatio
  /** Max width of the centered grid, any CSS length (e.g. `880px`). Defaults to the grid max width. */
  maxWidth?: string
  testId?: string
}

const DEFAULT_LINK_LABEL = 'See more'

export function SeImageTiles(props: SeImageTilesProps) {
  const {
    tiles,
    captionPosition = 'none',
    columns,
    aspectRatio,
    maxWidth,
    className,
    style,
    testId = 'se-image-tiles',
    ...rest
  } = props

  const layoutStyle = {
    ...style,
    ...(maxWidth ? { '--se-image-tiles-max-width': maxWidth } : {}),
    ...(columns
      ? {
          '--se-image-tiles-columns': columns,
          '--se-image-tiles-columns-mobile': Math.min(columns, 2),
        }
      : {}),
  } as CSSProperties

  return (
    <div
      data-fs-image-tiles
      data-testid={testId}
      data-layout={columns ? 'grid' : 'row'}
      data-aspect-ratio={aspectRatio}
      data-caption-position={captionPosition}
      className={[styles.imageTiles, className].filter(Boolean).join(' ')}
      style={layoutStyle}
      {...rest}
    >
      <div data-fs-image-tiles-grid className={styles.grid}>
        {tiles.map((tile, index) => (
          <a
            key={`${tile.url}-${index}`}
            href={tile.url}
            data-fs-image-tiles-tile
            className={styles.tile}
          >
            <span data-fs-image-tiles-tile-media className={styles.media}>
              <img
                src={tile.src}
                alt={tile.alt}
                loading="lazy"
                data-fs-image-tiles-tile-image
                className={styles.tileImage}
              />
            </span>
            {captionPosition === 'below' && (
              <span data-fs-image-tiles-tile-caption className={styles.caption}>
                {tile.title && <span className={styles.captionTitle}>{tile.title}</span>}
                <span className={styles.captionLabel}>{tile.linkLabel || DEFAULT_LINK_LABEL}</span>
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
