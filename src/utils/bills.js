import { addDays } from './dates'

const pad = (n) => String(n).padStart(2, '0')

// month is 1 to 12
function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function toUTC(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export const FREQ_LABEL = {
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
}

// the due date after this one. anchorDay keeps a bill on the 31st
// landing on the last day of shorter months, then back on the 31st
export function addPeriod(dateStr, frequency, anchorDay) {
  if (frequency === 'weekly') return addDays(dateStr, 7)

  const [y, m, d] = dateStr.split('-').map(Number)
  const wanted = anchorDay || d

  if (frequency === 'yearly') {
    const ny = y + 1
    return `${ny}-${pad(m)}-${pad(Math.min(wanted, daysInMonth(ny, m)))}`
  }

  let ny = y
  let nm = m + 1
  if (nm === 13) {
    nm = 1
    ny += 1
  }
  return `${ny}-${pad(nm)}-${pad(Math.min(wanted, daysInMonth(ny, nm)))}`
}

// negative means the date has already passed
export function daysUntil(dateStr, today) {
  return Math.round((toUTC(dateStr) - toUTC(today)) / 86400000)
}

// what a bill costs per month on average
export function monthlyEquivalent(amount, frequency) {
  if (frequency === 'weekly') return (amount * 52) / 12
  if (frequency === 'yearly') return amount / 12
  return amount
}