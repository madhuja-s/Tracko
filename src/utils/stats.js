import { addDays, weekdayOf } from './dates'

function scheduledCount(tasks, date) {
  const wd = weekdayOf(date)
  return tasks.filter((t) => t.active && t.weekdays?.includes(wd)).length
}

// stats for one day. percent is null on a rest day (no tasks scheduled)
export function dayStat(tasks, logs, date) {
  const log = logs[date]
  const total = log?.total ?? scheduledCount(tasks, date)
  const done = log?.doneCount ?? 0
  if (!total) return { total: 0, done: 0, percent: null, full: false }
  return {
    total,
    done,
    percent: Math.min(100, Math.round((done / total) * 100)),
    full: done >= total,
  }
}

// current streak: days in a row with every task done
export function computeStreak(tasks, logs, today) {
  let streak = 0
  for (let i = 0; i < 366; i++) {
    const s = dayStat(tasks, logs, addDays(today, -i))
    if (s.percent === null) continue // rest day: skip
    if (s.full) streak++
    else if (i === 0) continue // today not finished yet: keep going back
    else break
  }
  return streak
}

// longest streak ever
export function bestStreak(tasks, logs, today) {
  const dates = Object.keys(logs).sort()
  if (dates.length === 0) return 0

  let best = 0
  let run = 0
  let date = dates[0]
  while (date <= today) {
    const s = dayStat(tasks, logs, date)
    if (s.percent !== null) {
      if (s.full) {
        run++
        best = Math.max(best, run)
      } else if (date !== today) {
        run = 0
      }
    }
    date = addDays(date, 1)
  }
  return best
}

// summary between two dates (both included)
export function rangeSummary(tasks, logs, start, end) {
  let days = 0
  let full = 0
  let sum = 0
  let doneTasks = 0
  let totalTasks = 0

  let date = start
  while (date <= end) {
    const s = dayStat(tasks, logs, date)
    if (s.percent !== null) {
      days++
      sum += s.percent
      if (s.full) full++
      doneTasks += s.done
      totalTasks += s.total
    }
    date = addDays(date, 1)
  }

  return {
    days,
    full,
    avg: days ? Math.round(sum / days) : 0,
    doneTasks,
    totalTasks,
  }
}