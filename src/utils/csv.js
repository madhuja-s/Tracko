const BOM = '\uFEFF' // lets Excel show ₹ and other characters correctly

function cell(v) {
  if (v === null || v === undefined) return ''
  let s = String(v)

  // stop spreadsheets from running text that starts like a formula
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`

  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(headers, rows) {
  return [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
}

export function downloadFile(filename, content, type) {
  const body = type.includes('csv') ? BOM + content : content
  const blob = new Blob([body], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const stamp = () => new Date().toISOString().slice(0, 10)