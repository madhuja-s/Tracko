import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import {
  exportMoneyCsv,
  exportRoutineCsv,
  exportSavingsCsv,
  exportBillsCsv,
  exportBackupJson,
} from '../services/exportService'
import { btnCls, btnOutlineCls } from '../styles'

const card = 'bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6'

export default function Account() {
  const { user, profile } = useAuth()
  const { canInstall, installed, isIOS, install } = useInstallPrompt()
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  async function run(label, fn) {
    setMsg('')
    setBusy(label)
    try {
      const count = await fn(user.uid)
      setMsg(
        typeof count === 'number'
          ? `${label} downloaded (${count} row${count === 1 ? '' : 's'}) ✓`
          : `${label} downloaded ✓`,
      )
    } catch (err) {
      console.error(err)
      setMsg('Could not download. Please check your internet and try again.')
    }
    setBusy('')
  }

  const downloads = [
    ['Money entries', exportMoneyCsv, 'CSV'],
    ['Routine history', exportRoutineCsv, 'CSV'],
    ['Savings', exportSavingsCsv, 'CSV'],
    ['Bills', exportBillsCsv, 'CSV'],
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <Link to="/" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to today
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Your account 👤
      </h1>

      <div className={`mt-4 ${card}`}>
        <p className="font-bold">{profile?.name || user.displayName || 'You'}</p>
        <p className="text-sm opacity-70">{user.email}</p>
      </div>

      {/* install */}
      <div className={`mt-4 ${card}`}>
        <h2 className="font-bold">Install Tracko 📲</h2>

        {installed ? (
          <p className="mt-2 text-sm font-semibold text-deepsage dark:text-sage">
            Tracko is installed on this device ✓
          </p>
        ) : canInstall ? (
          <>
            <p className="mt-2 text-sm opacity-80">
              Add Tracko to your home screen or desktop. It opens full-screen like an app.
            </p>
            <button className={`${btnCls} mt-3`} onClick={install}>
              Install Tracko
            </button>
          </>
        ) : isIOS ? (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm opacity-90">
            <li>Open Tracko in <b>Safari</b>.</li>
            <li>Tap the <b>Share</b> button (square with an arrow).</li>
            <li>Scroll and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li>
          </ol>
        ) : (
          <p className="mt-2 text-sm opacity-80">
            Open Tracko in <b>Chrome</b> or <b>Edge</b>, then use the browser menu (the three
            dots) and choose <b>Install app</b> or <b>Add to Home screen</b>. This works on the
            live website, not while it runs on your own computer for testing.
          </p>
        )}
      </div>

      {/* downloads */}
      <div className={`mt-4 ${card}`}>
        <h2 className="font-bold">Download your data ⬇️</h2>
        <p className="mt-1 text-sm opacity-80">
          Your data is yours. CSV files open in Excel and Google Sheets.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {downloads.map(([label, fn, kind]) => (
            <button
              key={label}
              type="button"
              disabled={!!busy}
              onClick={() => run(label, fn)}
              className="rounded-2xl border-2 border-sage bg-white/50 dark:bg-dark-bg px-3 py-3 text-left font-bold disabled:opacity-60"
            >
              <span className="block text-sm">{label}</span>
              <span className="text-xs font-semibold opacity-70">
                {busy === label ? 'Preparing...' : `${kind} file`}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!!busy}
          onClick={() => run('Full backup', exportBackupJson)}
          className={`${btnOutlineCls} mt-3`}
        >
          {busy === 'Full backup' ? 'Preparing...' : 'Full backup (everything in one file)'}
        </button>

        {msg && (
          <p className="mt-3 text-sm font-semibold text-deepsage dark:text-sage">{msg}</p>
        )}
      </div>
    </div>
  )
}