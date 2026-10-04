import { addDays, weekdayOf, startOfWeek } from './dates'
import { dayStat, rangeSummary } from './stats'
import { monthStartFor, prevMonthStart, monthEndFor } from './financeMonth'
import { round2 } from './money'

// the first day you ticked anything. earlier days are "no data", not 0%
function firstLogDate(logs) {
  const keys = Object.keys(logs).sort()
  return keys.length ? keys[0] : null
}

export function dailySeries(tasks, logs, today, n) {
  const since = firstLogDate(logs)
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    if (!since || date < since) {
      out.push({ date, percent: null, done: 0, total: 0 })
      continue
    }
    const s = dayStat(tasks, logs, date)
    out.push({ date, percent: s.percent, done: s.done, total: s.total })
  }
  return out
}

export function weeklySeries(tasks, logs, today, weeks) {
  const since = firstLogDate(logs)
  const thisWeek = startOfWeek(today)
  const out = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(thisWeek, -7 * i)
    const weekEnd = addDays(start, 6)
    const end = weekEnd > today ? today : weekEnd
    if (!since || end < since) {
      out.push({ start, avg: 0, days: 0, full: 0 })
      continue
    }
    const s = rangeSummary(tasks, logs, start < since ? since : start, end)
    out.push({ start, avg: s.avg, days: s.days, full: s.full })
  }
  return out
}

export function heatmapCells(tasks, logs, today, weeks) {
  const since = firstLogDate(logs)
  const first = addDays(startOfWeek(today), -7 * (weeks - 1))
  const cells = []
  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(first, i)
    if (date > today) {
      cells.push({ date, future: true })
    } else if (!since || date < since) {
      cells.push({ date, future: false, percent: null, done: 0, total: 0 })
    } else {
      const s = dayStat(tasks, logs, date)
      cells.push({ date, future: false, percent: s.percent, done: s.done, total: s.total })
    }
  }
  return cells
}

// for every task: how often you did it on the days it was scheduled
export function habitConsistency(tasks, logs, today, days, tz) {
  const since = firstLogDate(logs)
  if (!since) return []

  const windowStart = addDays(today, -(days - 1))
  const from = windowStart < since ? since : windowStart

  return tasks
    .filter((t) => t.active)
    .map((t) => {
      const created = t.createdAt?.seconds
        ? new Date(t.createdAt.seconds * 1000).toLocaleDateString('en-CA', {
            timeZone: tz || undefined,
          })
        : today

      let scheduled = 0
      let done = 0
      for (let d = from; d <= today; d = addDays(d, 1)) {
        if (d < created) continue
        if (!t.weekdays?.includes(weekdayOf(d))) continue
        scheduled++
        if (logs[d]?.doneIds?.includes(t.id)) done++
      }
      return {
        id: t.id,
        name: t.name,
        scheduled,
        done,
        percent: scheduled ? Math.round((done / scheduled) * 100) : null,
      }
    })
    .filter((h) => h.percent !== null)
    .sort((a, b) => b.percent - a.percent)
}

/* ---------- money ---------- */

function monthLabelShort(start, startDay) {
  const [y, m] = start.split('-').map(Number)
  const name = new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' })
  return startDay === 1 ? name : `${startDay} ${name}`
}

// the last `count` finance months, oldest first
export function monthRanges(today, startDay, count) {
  let start = monthStartFor(today, startDay)
  const out = []
  for (let i = 0; i < count; i++) {
    out.unshift({ start, end: monthEndFor(start) })
    start = prevMonthStart(start)
  }
  return out.map((r) => ({ ...r, label: monthLabelShort(r.start, startDay) }))
}

export function bucketByMonth(items, ranges) {
  return ranges.map((r) => {
    let income = 0
    let spent = 0
    items.forEach((t) => {
      if (t.date >= r.start && t.date <= r.end) {
        if (t.type === 'income') income += t.amount
        else spent += t.amount
      }
    })
    return { ...r, income: round2(income), spent: round2(spent) }
  })
}

// money spent on each day of a finance month, up to today
export function dailySpending(items, start, end, today) {
  const last = end < today ? end : today
  const map = {}
  items.forEach((t) => {
    if (t.type === 'expense') map[t.date] = (map[t.date] || 0) + t.amount
  })
  const out = []
  for (let d = start; d <= last; d = addDays(d, 1)) {
    out.push({ date: d, amount: round2(map[d] || 0) })
  }
  return out
}

export function compactMoney(n) {
  const v = Math.abs(n)
  if (v >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`
  if (v >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  if (v >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`
  return `₹${Math.round(n)}`
}