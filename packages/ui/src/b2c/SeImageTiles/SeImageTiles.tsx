import type { HTMLAttributes } from 'react'
import type { ImageTile } from '@vtex-us-se/components'
import styles from './SeImageTiles.module.scss'

export interface SeImageTilesProps extends HTMLAttributes<HTMLDivElement> {
  /** 2 to 4 clickable image tiles, displayed side-by-side. */
  tiles: ImageTile[]
  testId?: string
}

export function SeImageTiles(props: SeImageTilesProps) {
  const { tiles, className, testId = 'se-image-tiles', ...rest } = props

  return (
    <div
      data-fs-image-tiles
      data-testid={testId}
      className={[styles.imageTiles, className].filter(Boolean).join(' ')}
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
            <img
              src={tile.src}
              alt={tile.alt}
              loading="lazy"
              data-fs-image-tiles-tile-image
              className={styles.tileImage}
            />
          </a>
        ))}
      </div>
    </div>
  )
}
