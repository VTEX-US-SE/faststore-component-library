import { useB2bSession } from '@vtex-us-se/components/b2b'
import styles from './SeWelcomeBackMessage.module.scss'

export type SeWelcomeBackMessageProps = {
  greetings: string
  text?: string
}

export function SeWelcomeBackMessage({ greetings, text }: SeWelcomeBackMessageProps) {
  const b2b = useB2bSession()
  if (!b2b) return null

  const { userName } = b2b

  return (
    <section className={styles.welcomeBackMessage}>
      <h2>
        {greetings}, {userName}
      </h2>
      {text && <p>{text}</p>}
    </section>
  )
}
