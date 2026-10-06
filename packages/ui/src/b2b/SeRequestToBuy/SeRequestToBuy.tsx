import { useId, type FormEvent } from 'react'
import { useRequestToBuyForm } from '@vtex-us-se/components/b2b'
import type { RequestToBuyField } from '@vtex-us-se/components/b2b'
import styles from './SeRequestToBuy.module.scss'

export type SeRequestToBuyProps = {
  title?: string
  description?: string
  ctaLabel?: string
  submittingLabel?: string
  successMessage?: string
  /** Shown when a required field is empty. */
  validationMessage?: string
  /** Shown when the request was sent but not stored. */
  errorMessage?: string
}

type FieldConfig = {
  field: RequestToBuyField
  label: string
  type: 'text' | 'email' | 'tel'
  autoComplete: string
  required: boolean
}

const INPUT_FIELDS: FieldConfig[] = [
  { field: 'companyName', label: 'Company name', type: 'text', autoComplete: 'organization', required: true },
  { field: 'contactName', label: 'Contact name', type: 'text', autoComplete: 'name', required: true },
  { field: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
  { field: 'phone', label: 'Phone (optional)', type: 'tel', autoComplete: 'tel', required: false },
]

/**
 * "Request buyer access" form for prospective B2B organizations, stored as a Master Data
 * document through the `seSubmitOrganizationRequest` mutation (the resolvers package's
 * `organizationRequest` operation).
 *
 * Needs GraphQL of its own, so it must be added with `se-components add SeRequestToBuy` (source
 * copy, mutation text inlined) plus `se-components add-resolver organizationRequest` — a plain
 * npm import can't be seen by the project's GraphQL codegen and fails when rendered.
 */
export function SeRequestToBuy({
  title = 'Request buyer access',
  description,
  ctaLabel = 'Request to Buy',
  submittingLabel = 'Sending…',
  successMessage = 'Thank you. We’ll be in touch soon.',
  validationMessage = 'Please fill in all required fields (Company name, Contact name, and Email).',
  errorMessage = 'Something went wrong. Please try again.',
}: SeRequestToBuyProps) {
  const idPrefix = useId()
  const { values, setField, submit, status } = useRequestToBuyForm()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  return (
    <section className={styles.requestToBuy} data-fs-se-request-to-buy>
      <div className={styles.card}>
        <h2 className={styles.title}>{title}</h2>

        {status === 'success' ? (
          <p className={styles.success} role="status">
            {successMessage}
          </p>
        ) : (
          <>
            {description && <p className={styles.description}>{description}</p>}
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.grid}>
                {INPUT_FIELDS.map(({ field, label, type, autoComplete, required }) => (
                  <label key={field} className={styles.field} htmlFor={`${idPrefix}-${field}`}>
                    <span className={styles.label}>{label}</span>
                    <input
                      id={`${idPrefix}-${field}`}
                      className={styles.input}
                      type={type}
                      autoComplete={autoComplete}
                      required={required}
                      aria-required={required}
                      value={values[field]}
                      placeholder={label.replace(' (optional)', '')}
                      onChange={(event) => setField(field, event.target.value)}
                    />
                  </label>
                ))}
              </div>

              <label className={styles.field} htmlFor={`${idPrefix}-message`}>
                <span className={styles.label}>Message (optional)</span>
                <textarea
                  id={`${idPrefix}-message`}
                  className={styles.textarea}
                  rows={4}
                  value={values.message}
                  placeholder="Message"
                  onChange={(event) => setField('message', event.target.value)}
                />
              </label>

              {(status === 'invalid' || status === 'error') && (
                <p className={styles.alert} role="alert">
                  {status === 'invalid' ? validationMessage : errorMessage}
                </p>
              )}

              {/* Only disabled while sending: a button disabled for missing fields gives no hint why. */}
              <button type="submit" className={styles.submit} disabled={status === 'submitting'}>
                {status === 'submitting' ? submittingLabel : ctaLabel}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  )
}
