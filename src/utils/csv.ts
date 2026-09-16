export function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): void {
  const lines = [
    headers.map((header) => escapeCsv(header)).join(','),
    ...rows.map((row) =>
      row.map((cell) => escapeCsv(cell == null ? '' : String(cell))).join(','),
    ),
  ]
  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  out.push(current.trim())
  return out
}

function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase().replace(/[_\s]+/g, '')
  const map: Record<string, string> = {
    businessname: 'businessName',
    merchant: 'businessName',
    merchantname: 'businessName',
    legalname: 'legalName',
    category: 'category',
    description: 'description',
    registrationno: 'registrationNo',
    registration: 'registrationNo',
    phone: 'phone',
    email: 'email',
    address: 'address',
    postcode: 'postcode',
    city: 'city',
    state: 'state',
    status: 'status',
    picname: 'picName',
    latitude: 'latitude',
    longitude: 'longitude',
  }
  return map[key] ?? header.trim()
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map(normalizeHeader)
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      if (header) row[header] = cells[index] ?? ''
    })
    return row
  })
}
