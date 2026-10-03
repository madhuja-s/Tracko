import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { saveReminderSettings } from '../services/settingsService'
import { inputCls, btnCls, btnOutlineCls } from '../styles'

export default function Settings() {
  const { user, profile } = useAuth()
  const [on, setOn] = useState(profile?.remindersOn ?? true)
  const [time, setTime] = useState(profile?.reminderTime || '08:00')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [perm, setPerm] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported',
  )

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    if (!time) return setMsg('Please pick a time.')
    setBusy(true)
    try {
      await saveReminderSettings(user.uid, { remindersOn: on, reminderTime: time })
      setMsg('Saved ✓')
    } catch (err) {
      console.error(err)
      setMsg('Could not save. Please try again.')
    }
    setBusy(false)
  }

  async function allowNotifications() {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPerm(result)
    if (result === 'granted') {
      try {
        new Notification('Notifications are on 🌸', {
          body: 'You will get a reminder at your chosen time.',
        })
      } catch {
        // some phone browsers block this
      }
    }
  }

  const permText = {
    granted: 'Allowed ✓',
    denied: 'Blocked. Allow it from the lock icon next to the web address.',
    default: 'Not asked yet',
    unsupported: 'This browser does not support notifications',
  }[perm]

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto">
      <Link to="/" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to today
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Reminders ⏰
      </h1>

      <form
        onSubmit={handleSave}
        className="mt-5 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-4"
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => setOn(e.target.checked)}
            className="h-5 w-5 accent-[#5E7F5E]"
          />
          <span className="font-semibold">Remind me every day</span>
        </label>

        <div>
          <label htmlFor="rtime" className="text-sm font-bold">
            Reminder time
          </label>
          <input
            id="rtime"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`${inputCls} mt-1`}
          />
          <p className="mt-1 text-xs opacity-70">
            You are reminded only if you still have tasks left today.
          </p>
        </div>

        {msg && <p className="text-sm font-semibold text-deepsage dark:text-sage">{msg}</p>}
        <button className={btnCls} disabled={busy}>
          {busy ? 'Saving...' : 'Save'}
        </button>
      </form>

      <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-3">
        <h2 className="font-bold">Pop-up notifications</h2>
        <p className="text-sm opacity-80">Status: {permText}</p>
        {perm !== 'granted' && perm !== 'unsupported' && perm !== 'denied' && (
          <button type="button" className={btnOutlineCls} onClick={allowNotifications}>
            Allow notifications
          </button>
        )}
        <p className="text-xs opacity-70">
          Reminders show while the app is open in a browser tab. On some phones, pop-ups
          work only after you install the app to your home screen. The pink banner
          always works.
        </p>
      </div>
    </div>
  )
}