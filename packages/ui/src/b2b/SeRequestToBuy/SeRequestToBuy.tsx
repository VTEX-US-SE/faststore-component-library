import { Alert, Button, Card, InputField, TextareaField } from '@faststore/ui'
import { useRequestToBuyForm } from '@vtex-us-se/components/b2b'
import styles from './SeRequestToBuy.module.scss'

export interface SeRequestToBuyProps {
  title?: string
  description?: string
  ctaLabel?: string
}

export function SeRequestToBuy({
  title = 'Request buyer access',
  description,
  ctaLabel = 'Request to Buy',
}: SeRequestToBuyProps) {
  const {
    companyName,
    setCompanyName,
    contactName,
    setContactName,
    email,
    setEmail,
    phone,
    setPhone,
    message,
    setMessage,
    success,
    error,
    validationError,
    loading,
    canSubmit,
    handleSubmit,
  } = useRequestToBuyForm()

  if (success) {
    return (
      <section className={styles.seRequestToBuy}>
        <Card title={title} className={styles.card}>
          <div className={styles.success}>
            <p>Thank you. We&apos;ll be in touch soon.</p>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section className={styles.seRequestToBuy}>
      <Card title={title} className={styles.card}>
        {description && <p className={styles.description}>{description}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <InputField
              id="serequesttobuy-company"
              type="text"
              label="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
              required
            />
            <InputField
              id="serequesttobuy-contact"
              type="text"
              label="Contact name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name"
              required
            />
            <InputField
              id="serequesttobuy-email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <InputField
              id="serequesttobuy-phone"
              type="tel"
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
            />
          </div>
          <div className={styles.textareaFieldWrap}>
            <TextareaField
              id="serequesttobuy-message"
              label="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message"
              rows={4}
            />
          </div>
          {(validationError || error) && (
            <Alert className={styles.alert}>
              {validationError
                ? 'Please fill in all required fields (Company name, Contact name, and Email).'
                : 'Something went wrong. Please try again.'}
            </Alert>
          )}
          <Button type="submit" variant="primary" disabled={!canSubmit} className={styles.submitButton}>
            {loading ? 'Sending…' : ctaLabel}
          </Button>
        </form>
      </Card>
    </section>
  )
}
