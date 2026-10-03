import { addDays, shortDate } from './dates'

const pad = (n) => String(n).padStart(2, '0')

// the date your finance month started, for any date (startDay is 1 to 28)
export function monthStartFor(dateStr, startDay) {
  const [y, m, d] = dateStr.split('-').map(Number)
  let yy = y
  let mm = m
  if (d < startDay) {
    mm -= 1
    if (mm === 0) {
      mm = 12
      yy -= 1
    }
  }
  return `${yy}-${pad(mm)}-${pad(startDay)}`
}

export function nextMonthStart(startStr) {
  const [y, m, d] = startStr.split('-').map(Number)
  return m === 12 ? `${y + 1}-01-${pad(d)}` : `${y}-${pad(m + 1)}-${pad(d)}`
}

export function prevMonthStart(startStr) {
  const [y, m, d] = startStr.split('-').map(Number)
  return m === 1 ? `${y - 1}-12-${pad(d)}` : `${y}-${pad(m - 1)}-${pad(d)}`
}

// last day of that finance month
export function monthEndFor(startStr) {
  return addDays(nextMonthStart(startStr), -1)
}

export function rangeLabel(start, end) {
  return `${shortDate(start)} – ${shortDate(end)} ${end.slice(0, 4)}`
}