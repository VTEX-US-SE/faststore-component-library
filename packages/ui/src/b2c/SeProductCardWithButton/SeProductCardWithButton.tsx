import type { HTMLAttributes } from 'react'
import { LinkButton } from '@faststore/ui'
import { useFormattedPrice, type SeProductCardProduct } from '@vtex-us-se/components'
import styles from './SeProductCardWithButton.module.scss'

export interface SeProductCardWithButtonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Product data to render. Typically injected by a shelf/PLP slot, not authored via CMS. */
  product: SeProductCardProduct
  /** Label for the action button (e.g. "Choose option"). */
  buttonLabel: string
  /** Hides the action button, mirroring the native card's out-of-stock behavior. */
  outOfStock?: boolean
  linkTargetBlank?: boolean
  /** Fired when the action button is activated, before navigating to `product.href` (e.g. for analytics). */
  onButtonClick?: () => void
  testId?: string
}

export function SeProductCardWithButton(props: SeProductCardWithButtonProps) {
  const {
    product,
    buttonLabel,
    outOfStock = false,
    linkTargetBlank = false,
    onButtonClick,
    className,
    testId = 'se-product-card-with-button',
    ...rest
  } = props

  const formattedPrice = useFormattedPrice(product.price)
  const target = linkTargetBlank ? '_blank' : undefined

  return (
    <div
      data-fs-product-card-with-button
      data-testid={testId}
      className={[styles.card, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <a
        href={product.href}
        target={target}
        rel={linkTargetBlank ? 'noopener noreferrer' : undefined}
        data-fs-product-card-with-button-image-link
        className={styles.imageLink}
      >
        <img
          src={product.image.src}
          alt={product.image.alt}
          loading="lazy"
          className={styles.image}
        />
      </a>

      <div data-fs-product-card-with-button-info className={styles.info}>
        <a
          href={product.href}
          target={target}
          rel={linkTargetBlank ? 'noopener noreferrer' : undefined}
          data-fs-product-card-with-button-title
          className={styles.title}
        >
          {product.name}
        </a>

        <div data-fs-product-card-with-button-price className={styles.price}>
          {formattedPrice.hasDiscount && (
            <span
              data-fs-product-card-with-button-list-price
              className={styles.listPrice}
            >
              {formattedPrice.listPrice}
            </span>
          )}
          <span
            data-fs-product-card-with-button-current-price
            className={styles.currentPrice}
          >
            {formattedPrice.current}
          </span>
        </div>
      </div>

      {!outOfStock && (
        <div data-fs-product-card-with-button-cta className={styles.cta}>
          <LinkButton href={product.href} target={target} onClick={onButtonClick}>
            {buttonLabel}
          </LinkButton>
        </div>
      )}
    </div>
  )
}
