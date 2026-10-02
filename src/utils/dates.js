export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// today's date as YYYY-MM-DD in the user's own time zone
export function todayInZone(tz) {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz || undefined })
}

function parts(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// 0 = Sunday ... 6 = Saturday
export function weekdayOf(dateStr) {
  return parts(dateStr).getDay()
}

export function prettyDate(dateStr) {
  return parts(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}