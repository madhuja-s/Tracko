import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRoutineData } from '../hooks/useRoutineData'
import QuickLinks from '../components/QuickLinks'
import { todayInZone, weekdayOf, prettyDate } from '../utils/dates'
import { computeStreak, bestStreak } from '../utils/stats'
import { setDayLog } from '../services/routineService'

export default function Dashboard() {
  const { user, profile, logout } = useAuth()
  const tz = profile?.timeZone
  const { tasks, logs, ready } = useRoutineData(user.uid)

  const [today, setToday] = useState(() => todayInZone(tz))

  // notice when the date changes (midnight) while the app is open
  useEffect(() => {
    setToday(todayInZone(tz))
    const timer = setInterval(() => setToday(todayInZone(tz)), 30000)
    return () => clearInterval(timer)
  }, [tz])

  const weekday = weekdayOf(today)

  const todaysTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.active && t.weekdays?.includes(weekday))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [tasks, weekday],
  )

  const doneIds = logs[today]?.doneIds || []
  const doneCount = todaysTasks.filter((t) => doneIds.includes(t.id)).length
  const percent = todaysTasks.length
    ? Math.round((doneCount / todaysTasks.length) * 100)
    : 0

  const streak = useMemo(
    () => computeStreak(tasks, logs, today),
    [tasks, logs, today],
  )
  const best = useMemo(
    () => bestStreak(tasks, logs, today),
    [tasks, logs, today],
  )

  async function toggle(taskId) {
    const next = doneIds.includes(taskId)
      ? doneIds.filter((id) => id !== taskId)
      : [...doneIds, taskId]
    const validIds = next.filter((id) => todaysTasks.some((t) => t.id === id))
    await setDayLog(user.uid, today, validIds, todaysTasks.length)
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-deepsage dark:text-sage">
            Hi {profile?.name || user.displayName || 'there'} 🌸
          </h1>
          <p className="opacity-70 text-sm">{prettyDate(today)}</p>
        </div>
        <button onClick={logout} className="text-sm underline opacity-70">
          Log out
        </button>
      </div>

      {ready && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
            <p className="text-3xl font-extrabold text-deepsage dark:text-sage">
              🔥 {streak}
            </p>
            <p className="text-xs opacity-70">day streak</p>
          </div>
          <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
            <p className="text-3xl font-extrabold text-deepsage dark:text-sage">
              🏆 {Math.max(best, streak)}
            </p>
            <p className="text-xs opacity-70">best streak</p>
          </div>
        </div>
      )}

      <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Today's routine</h2>
          <span className="text-sm font-semibold text-deepsage dark:text-sage">
            {doneCount}/{todaysTasks.length} done
          </span>
        </div>

        <div className="mt-3 h-3 rounded-full bg-white/70 dark:bg-dark-bg overflow-hidden">
          <div
            className="h-full bg-sage transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-5 space-y-2">
          {todaysTasks.length === 0 && (
            <p className="text-sm opacity-70">
              No tasks for today. Add some in "Edit routine".
            </p>
          )}

          {todaysTasks.map((t) => {
            const done = doneIds.includes(t.id)
            return (
              <label
                key={t.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer transition ${
                  done ? 'bg-blush/60' : 'bg-white/60 dark:bg-dark-bg'
                }`}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(t.id)}
                  className="h-5 w-5"
                />
                <span className={done ? 'line-through opacity-60' : ''}>
                  {t.name}
                </span>
              </label>
            )
          })}
        </div>

        {todaysTasks.length > 0 && doneCount === todaysTasks.length && (
          <p className="mt-4 text-center font-semibold text-deepsage dark:text-sage">
            All done for today! 🎉
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            to="/routine"
            className="text-center rounded-full border-2 border-sage text-deepsage dark:text-sage font-bold py-2"
          >
            Edit routine
          </Link>
          <Link
            to="/goals"
            className="text-center rounded-full bg-blush text-charcoal font-bold py-2"
          >
            Goals & progress
          </Link>
        </div>

        <Link
          to="/money"
          className="mt-3 block text-center rounded-full bg-sage text-charcoal font-bold py-2"
        >
          💰 Money
        </Link>

        <QuickLinks />
      </div>
    </div>
  )
}