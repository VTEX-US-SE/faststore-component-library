import { useB2bSession } from '@vtex-us-se/components/b2b'
import type { ActionHub, BulletinBoard } from '@vtex-us-se/components/b2b'
import styles from './SeActionHubBulletinBoard.module.scss'

export type SeActionHubBulletinBoardProps = {
  actionHub?: ActionHub
  bulletinBoard?: BulletinBoard
}

function ActionHubIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.9992 4.09995L11.9992 5.99995M5.09922 7.99995L2.19922 7.19995M5.99922 12L4.09922 14M7.19922 2.19995L7.99922 5.09995M9.03622 9.68995C8.99744 9.5986 8.98684 9.49776 9.00578 9.40034C9.02471 9.30293 9.07232 9.21339 9.14249 9.14322C9.21266 9.07305 9.3022 9.02544 9.39961 9.00651C9.49702 8.98757 9.59787 8.99818 9.68922 9.03695L20.6892 13.537C20.7871 13.5771 20.8698 13.6473 20.9252 13.7374C20.9807 13.8275 21.0062 13.9329 20.9979 14.0384C20.9897 14.1439 20.9482 14.2441 20.8795 14.3245C20.8107 14.4049 20.7182 14.4615 20.6152 14.486L16.2662 15.527C16.0867 15.5698 15.9225 15.6616 15.7919 15.792C15.6613 15.9224 15.5693 16.0865 15.5262 16.266L14.4862 20.616C14.462 20.7192 14.4055 20.8121 14.325 20.8812C14.2445 20.9503 14.144 20.992 14.0383 21.0002C13.9325 21.0085 13.8268 20.9828 13.7366 20.9271C13.6463 20.8713 13.5762 20.7882 13.5362 20.69L9.03622 9.68995Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BulletinBoardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.2673 21C10.4428 21.304 10.6953 21.5565 10.9993 21.732C11.3033 21.9075 11.6482 21.9999 11.9993 21.9999C12.3503 21.9999 12.6952 21.9075 12.9992 21.732C13.3033 21.5565 13.5557 21.304 13.7313 21M3.26127 15.326C3.13063 15.4692 3.04442 15.6472 3.01312 15.8385C2.98183 16.0298 3.00679 16.226 3.08498 16.4034C3.16316 16.5807 3.2912 16.7316 3.45352 16.8375C3.61585 16.9434 3.80545 16.9999 3.99927 17H19.9993C20.1931 17.0001 20.3827 16.9438 20.5451 16.8381C20.7076 16.7324 20.8358 16.5817 20.9142 16.4045C20.9926 16.2273 21.0178 16.0311 20.9867 15.8398C20.9557 15.6485 20.8697 15.4703 20.7393 15.327C19.4093 13.956 17.9993 12.499 17.9993 8C17.9993 6.4087 17.3671 4.88258 16.2419 3.75736C15.1167 2.63214 13.5906 2 11.9993 2C10.408 2 8.88185 2.63214 7.75663 3.75736C6.63141 4.88258 5.99927 6.4087 5.99927 8C5.99927 12.499 4.58827 13.956 3.26127 15.326Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Signed-in B2B home widgets: quick-action links (desktop only — hidden by CSS below 1024px, as
 * in the kit) next to a short announcements list. Renders nothing outside a B2B session.
 */
export function SeActionHubBulletinBoard({ actionHub, bulletinBoard }: SeActionHubBulletinBoardProps) {
  const b2b = useB2bSession()
  if (!b2b) return null

  const actions = (actionHub?.actionList ?? []).filter((action) => action?.url && action?.text)
  const bulletins = (bulletinBoard?.items ?? []).filter((item) => item?.title)

  return (
    <section className={styles.actionHubBulletinBoard} data-fs-se-action-hub-bulletin-board>
      <div className={`${styles.panel} ${styles.actionHub}`} data-fs-se-action-hub>
        <div className={styles.heading}>
          <ActionHubIcon />
          <h3>{actionHub?.title}</h3>
        </div>
        <div className={styles.actionList}>
          {actions.map((action, idx) => (
            <a
              key={`${action.url}-${idx}`}
              className={styles.action}
              href={action.url}
              target={action.newTab ? '_blank' : undefined}
              rel={action.newTab ? 'noopener noreferrer' : undefined}
            >
              {action.icon && <img src={action.icon} alt="" />}
              <span>{action.text}</span>
            </a>
          ))}
        </div>
      </div>

      <div className={`${styles.panel} ${styles.bulletinBoard}`} data-fs-se-bulletin-board>
        <div className={styles.heading}>
          <BulletinBoardIcon />
          <h3>{bulletinBoard?.title}</h3>
        </div>
        <ul className={styles.bulletinList}>
          {bulletins.map((item, idx) => (
            <li key={`${item.title}-${idx}`} className={styles.bulletinItem}>
              <div className={styles.bulletinHeading}>
                <h4>{item.title}</h4>
                {item.text && <p>{item.text}</p>}
              </div>
              <div className={styles.bulletinMetaData}>
                {item.date && <span className={styles.date}>{item.date}</span>}
                {item.label && (
                  <span className={styles.label} data-label={item.label}>
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
