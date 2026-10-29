export type StockCsvRow = { line: number; refId: string; quantity: number }
export type StockCsvError = { line: number; refId: string; message: string }

/** Splits one CSV line on `delimiter`, honoring double-quoted fields ("a, b" and "" escapes). */
function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === delimiter) {
      fields.push(field)
      field = ''
    } else {
      field += char
    }
  }
  fields.push(field)
  return fields.map((value) => value.trim())
}

/**
 * Parses a `refId,quantity` CSV (header row required, any column order, extra columns ignored;
 * `;` works too, as Excel writes in many locales). Quantity defaults to 1. Replaces the kit's
 * papaparse dependency, which every store installing this component would have had to add.
 */
export function parseStockCsv(text: string): { rows: StockCsvRow[]; errors: StockCsvError[] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  const headerLine = lines[0] ?? ''
  const delimiter = (headerLine.match(/;/g)?.length ?? 0) > (headerLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const headers = splitCsvLine(headerLine, delimiter).map((header) => header.toLowerCase())
  const refIndex = headers.findIndex((header) => header === 'refid' || header === 'ref id' || header === 'reference')
  const quantityIndex = headers.findIndex((header) => header === 'quantity' || header === 'qty')

  if (refIndex === -1) {
    return { rows: [], errors: [{ line: 1, refId: '', message: 'Missing "refId" column' }] }
  }

  const rows: StockCsvRow[] = []
  const errors: StockCsvError[] = []

  lines.slice(1).forEach((line, index) => {
    if (!line.trim()) return
    const lineNumber = index + 2
    const fields = splitCsvLine(line, delimiter)
    const refId = fields[refIndex] ?? ''
    const rawQuantity = quantityIndex === -1 ? '' : (fields[quantityIndex] ?? '')
    const quantity = rawQuantity === '' ? 1 : Number(rawQuantity)

    if (!refId) {
      errors.push({ line: lineNumber, refId: '', message: 'Missing refId' })
    } else if (!Number.isInteger(quantity) || quantity < 1) {
      errors.push({ line: lineNumber, refId, message: 'Invalid quantity' })
    } else {
      rows.push({ line: lineNumber, refId, quantity })
    }
  })

  return { rows, errors }
}

/** A starter file for the import, built in the browser (the kit linked to a file on Google Drive). */
export function stockCsvTemplateHref(): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent('refId,quantity\nREF-0001,10\nREF-0002,5\n')}`
}
