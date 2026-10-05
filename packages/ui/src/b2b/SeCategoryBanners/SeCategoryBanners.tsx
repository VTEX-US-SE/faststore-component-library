import type { CategoryBanner } from '@vtex-us-se/components/b2b'
import styles from './SeCategoryBanners.module.scss'

export type SeCategoryBannersProps = {
  bannerList?: CategoryBanner[]
}

const MAX_BANNERS = 3

/**
 * Up to three promo banners: a row on desktop, a swipeable scroll-snap strip below 1024px.
 * The kit used `swiper` + a JS screen-size hook for the mobile variant; plain CSS does the same
 * without the extra dependency or the server/client layout mismatch on first render.
 */
export function SeCategoryBanners({ bannerList }: SeCategoryBannersProps) {
  const banners = (bannerList ?? []).slice(0, MAX_BANNERS)
  if (!banners.length) return null

  return (
    <section className={styles.categoryBanners} data-fs-se-category-banners>
      {banners.map((item, idx) => (
        <div
          key={`${item.title ?? ''}-${idx}`}
          className={styles.banner}
          style={item.banner ? { backgroundImage: `url(${item.banner})` } : undefined}
          data-fs-se-category-banner
        >
          <div className={styles.heading}>
            {item.title && <h4>{item.title}</h4>}
            {item.text && <p>{item.text}</p>}
          </div>
          {item.linkText && item.url && (
            <a className={styles.link} href={item.url}>
              {item.linkText}
            </a>
          )}
        </div>
      ))}
    </section>
  )
}
