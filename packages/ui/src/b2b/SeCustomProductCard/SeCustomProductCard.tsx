import { useB2bProductCard } from '@vtex-us-se/components/b2b'
import type { SeProductSummary } from '@vtex-us-se/components/b2b'
import styles from './SeCustomProductCard.module.scss'

export type SeCustomProductCardProps = {
  product: SeProductSummary
  index?: number
  /** Where anonymous shoppers are sent from "Login for price". FastStore's own login page by default. */
  loginUrl?: string
  perUnitLabel?: string
  viewItemLabel?: string
  loginLabel?: string
}

/**
 * Login-gated B2B product card: signed-in shoppers see the price (or price range across offers)
 * and a "View item" link; anonymous ones see a "Login for price" link instead.
 *
 * The kit's version wrapped the whole card in an `<a>` with a `<button>` inside (invalid nesting,
 * and the button hijacked the link with `window.location`) and read `loginUrl` from
 * `discovery.config` directly, which a published package can't import — both replaced here by
 * two plain links and a `loginUrl` prop.
 */
export function SeCustomProductCard({
  product,
  index = 0,
  loginUrl = '/login',
  perUnitLabel = 'Per unit',
  viewItemLabel = 'View item',
  loginLabel = 'Login for price',
}: SeCustomProductCardProps) {
  const card = useB2bProductCard(product, index)

  return (
    <article className={styles.card} data-fs-se-b2b-product-card>
      <a className={styles.productLink} href={card.href} onClick={card.onClick}>
        <div className={styles.image}>
          {card.imageUrl && <img src={card.imageUrl} alt={card.imageAlt} loading="lazy" width={300} height={300} />}
        </div>
        <p className={styles.name}>{card.name}</p>
      </a>

      <div className={styles.footer}>
        {card.isLoggedIn && (
          <div className={styles.price}>
            <p className={styles.perUnit}>{perUnitLabel}</p>
            <span className={styles.priceRange}>
              {card.minPrice}
              {card.hasPriceRange && ` - ${card.maxPrice}`}
            </span>
          </div>
        )}
        {card.isLoggedIn ? (
          <a className={styles.cta} href={card.href} onClick={card.onClick}>
            {viewItemLabel}
          </a>
        ) : (
          <a className={styles.cta} href={loginUrl}>
            {loginLabel}
          </a>
        )}
      </div>
    </article>
  )
}
