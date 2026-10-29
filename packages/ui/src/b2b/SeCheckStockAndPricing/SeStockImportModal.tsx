import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { stockCsvTemplateHref, type StockImportReport } from '@vtex-us-se/components/b2b'
import styles from './SeStockImportModal.module.scss'

type SeStockImportModalProps = {
  importCsv: (text: string) => Promise<StockImportReport>
  onConfirm: (report: StockImportReport) => void
  onClose: () => void
}

const MAX_FILE_SIZE = 1024 * 1024

/** Upload a `refId,quantity` CSV, review what matched, then add the matched SKUs to the worksheet. */
export function SeStockImportModal({ importCsv, onConfirm, onClose }: SeStockImportModalProps) {
  const [report, setReport] = useState<StockImportReport | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const processFile = async (file: File) => {
    setError('')
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Only CSV files are supported.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('The file is larger than 1 MB.')
      return
    }
    setBusy(true)
    try {
      setReport(await importCsv(await file.text()))
    } catch {
      setError('The file could not be read.')
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void processFile(file)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id={titleId}>{report ? 'Review import' : 'Import CSV'}</h2>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {!report ? (
          <div className={styles.body}>
            <div
              className={styles.dropzone}
              data-dragging={dragging}
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {busy ? (
                <p>Looking up your items…</p>
              ) : (
                <>
                  <p>
                    Drag &amp; drop a CSV here, or{' '}
                    <button type="button" className={styles.link} onClick={() => inputRef.current?.click()}>
                      browse
                    </button>
                  </p>
                  <span>Columns: refId, quantity</span>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void processFile(file)
                  event.target.value = ''
                }}
              />
            </div>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <a className={styles.link} href={stockCsvTemplateHref()} download="stock-and-pricing-template.csv">
              Download template
            </a>
          </div>
        ) : (
          <div className={styles.body}>
            <p className={styles.summary}>
              <strong>{report.found.length}</strong> items found
              {report.errors.length > 0 && (
                <>
                  , <strong>{report.errors.length}</strong> with errors
                </>
              )}
            </p>
            {report.errors.length > 0 && (
              <ul className={styles.errors}>
                {report.errors.map((entry) => (
                  <li key={`${entry.line}-${entry.refId}`}>
                    Line {entry.line}
                    {entry.refId && ` (${entry.refId})`}: {entry.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <footer className={styles.footer}>
          {report ? (
            <>
              <button type="button" className={styles.secondary} onClick={() => setReport(null)}>
                Upload another file
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={report.found.length === 0}
                onClick={() => onConfirm(report)}
              >
                Add {report.found.length} items
              </button>
            </>
          ) : (
            <button type="button" className={styles.secondary} onClick={onClose}>
              Cancel
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
