import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRoutineData } from '../hooks/useRoutineData'
import { todayInZone, weekdayOf } from '../utils/dates'

function timeNow(tz) {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: tz || undefined,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
}

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage blocked: reminders still work, they just may repeat
  }
}

function Watcher({ uid, profile }) {
  const navigate = useNavigate()
  const tz = profile.timeZone
  const enabled = profile.remindersOn ?? true
  const reminderTime = profile.reminderTime || '08:00'

  const { tasks, logs, ready } = useRoutineData(uid)
  const [, setTick] = useState(0)
  const [dismissedDay, setDismissedDay] = useState(() =>
    read(`reminder-dismissed-${uid}`),
  )

  // re-check the clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  const today = todayInZone(tz)
  const now = timeNow(tz)

  const remaining = useMemo(() => {
    const wd = weekdayOf(today)
    const todays = tasks.filter((t) => t.active && t.weekdays?.includes(wd))
    const done = logs[today]?.doneIds || []
    return todays.filter((t) => !done.includes(t.id)).length
  }, [tasks, logs, today])

  const due = ready && enabled && remaining > 0 && now >= reminderTime
  const showBanner = due && dismissedDay !== today

  // browser notification, once per day
  useEffect(() => {
    if (!due) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const key = `reminder-notified-${uid}`
    if (read(key) === today) return
    write(key, today)

    try {
      new Notification('Time for your routine 🌸', {
        body: `${remaining} task${remaining > 1 ? 's' : ''} left today.`,
      })
    } catch {
      // some phone browsers block this; the banner still shows
    }
  }, [due, today, remaining, uid])

  function dismiss() {
    write(`reminder-dismissed-${uid}`, today)
    setDismissedDay(today)
  }

  if (!showBanner) return null

  return (
    <div className="fixed top-3 left-1/2 z-50 w-[calc(100%-24px)] max-w-[520px] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-3xl bg-blush p-4 text-charcoal shadow-lg">
        <span className="text-2xl" aria-hidden="true">⏰</span>
        <div className="flex-1">
          <p className="font-bold">Time for your routine</p>
          <p className="text-sm">
            {remaining} task{remaining > 1 ? 's' : ''} left today.
          </p>
        </div>
        <button
          onClick={() => {
            navigate('/')
            dismiss()
          }}
          className="rounded-full bg-cream px-4 py-2 text-sm font-bold"
        >
          Open
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss for today"
          className="px-2 text-lg font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function ReminderWatcher() {
  const { user, profile } = useAuth()
  if (!user || !user.emailVerified || !profile?.onboardingDone) return null
  return <Watcher uid={user.uid} profile={profile} />
}