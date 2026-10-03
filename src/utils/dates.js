export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parts(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmt(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// today's date as YYYY-MM-DD in the user's own time zone
export function todayInZone(tz) {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz || undefined })
}

// 0 = Sunday ... 6 = Saturday
export function weekdayOf(dateStr) {
  return parts(dateStr).getDay()
}

export function addDays(dateStr, n) {
  const d = parts(dateStr)
  d.setDate(d.getDate() + n)
  return fmt(d)
}

// the Monday of the week that contains this date
export function startOfWeek(dateStr) {
  const wd = weekdayOf(dateStr)
  return addDays(dateStr, -((wd + 6) % 7))
}

export function prettyDate(dateStr) {
  return parts(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function shortDate(dateStr) {
  return parts(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export function monthLabel(dateStr) {
  return parts(dateStr).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}