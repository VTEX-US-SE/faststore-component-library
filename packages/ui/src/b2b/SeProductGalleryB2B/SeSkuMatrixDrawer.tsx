import { useEffect, useId } from 'react'
import { useSkuMatrix, type B2bListingProduct, type MoneyFormat } from '@vtex-us-se/components/product-gallery-b2b'
import type { SeProductGalleryB2BLabels } from './SeProductGalleryB2B'
import styles from './SeSkuMatrixDrawer.module.scss'

type SeSkuMatrixDrawerProps = {
  product: B2bListingProduct
  money: MoneyFormat
  labels: Required<SeProductGalleryB2BLabels>
  onClose: () => void
}

/** Every SKU of one product as a table row with a quantity field; adds all chosen SKUs at once. */
export function SeSkuMatrixDrawer({ product, money, labels, onClose }: SeSkuMatrixDrawerProps) {
  const matrix = useSkuMatrix(product, money)
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h3 id={titleId}>{labels.chooseOptions}</h3>
            <span>
              {product.isVariantOf.name} ({matrix.rows.length} {labels.productsCount})
            </span>
          </div>
          <button type="button" className={styles.close} aria-label={labels.close} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{labels.itemId}</th>
                {matrix.columns.map((column) => (
                  <th scope="col" key={column}>
                    {column}
                  </th>
                ))}
                <th scope="col">{labels.price}</th>
                <th scope="col">{labels.quantity}</th>
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.itemId}>
                  <td>
                    <span className={styles.sku}>
                      {row.imageUrl && <img src={row.imageUrl} alt={row.imageAlt} width={40} height={40} loading="lazy" />}
                      {row.label}
                    </span>
                  </td>
                  {row.attributes.map((value, index) => (
                    <td key={matrix.columns[index]}>{value}</td>
                  ))}
                  <td className={styles.price}>{row.price}</td>
                  <td>
                    <div className={styles.quantity}>
                      <button
                        type="button"
                        aria-label={`− ${row.label}`}
                        disabled={!row.purchasable || row.quantity === 0}
                        onClick={() => matrix.setQuantity(row.itemId, row.quantity - 1, row.available)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={row.available}
                        value={row.quantity}
                        disabled={!row.purchasable}
                        aria-label={`${labels.quantity} ${row.label}`}
                        onChange={(event) => matrix.setQuantity(row.itemId, event.target.valueAsNumber, row.available)}
                      />
                      <button
                        type="button"
                        aria-label={`+ ${row.label}`}
                        disabled={!row.purchasable || row.quantity >= row.available}
                        onClick={() => matrix.setQuantity(row.itemId, row.quantity + 1, row.available)}
                      >
                        +
                      </button>
                    </div>
                    <span className={styles.available}>
                      {row.available} {labels.available}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.footer}>
          <p className={styles.subtotal}>
            {labels.subtotal}{' '}
            <span>
              ({matrix.totalItems} {labels.items})
            </span>
            <strong>{matrix.subtotal}</strong>
          </p>
          <button
            type="button"
            className={styles.addToCart}
            disabled={matrix.totalItems === 0}
            onClick={(event) => {
              matrix.addToCart(event)
              matrix.reset()
              onClose()
            }}
          >
            {labels.addToCart}
          </button>
        </footer>
      </div>
    </div>
  )
}
