import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useVault } from '../context/VaultContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import {
  exportMoneyCsv,
  exportRoutineCsv,
  exportSavingsCsv,
  exportBillsCsv,
  exportBackupJson,
} from '../services/exportService'
import { deleteAccount } from '../services/accountService'
import { inputCls, btnCls, btnOutlineCls } from '../styles'

const card = 'bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6'

function deleteErrorText(err) {
  const code = err?.code || ''
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'That password is not right.'
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in was closed. Please try again.'
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many tries. Please wait a few minutes and try again.'
  }
  if (code === 'auth/requires-recent-login') {
    return 'For safety, please log out, log in again, and then retry.'
  }
  return `Failed at: ${err?.step || 'unknown step'} (${code || 'no code'}). Please send this to your developer.`
}

function DeleteAccount() {
  const { user } = useAuth()
  const { lock } = useVault()
  const usesPassword = user.providerData.some((p) => p.providerId === 'password')

  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleDelete(e) {
    e.preventDefault()
    setError('')

    if (confirmText !== 'DELETE') return setError('Type DELETE in capital letters to confirm.')
    if (usesPassword && !password) return setError('Enter your password.')

    setBusy(true)
    try {
      lock()
      await deleteAccount(user, password)
      // once the login is deleted, the app sends you back to the login page by itself
    } catch (err) {
      console.error(err)
      setError(deleteErrorText(err))
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 rounded-3xl border-2 border-red-300 bg-white/40 dark:bg-dark-card p-6">
      <h2 className="font-bold text-red-600">Delete my account</h2>
      <p className="mt-1 text-sm opacity-80">
        This removes your login and everything saved for you: routine, money, savings, bills and
        your vault. It cannot be undone. Download your data first if you want to keep a copy.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-full border-2 border-red-400 px-5 py-2 text-sm font-bold text-red-600"
        >
          I want to delete my account
        </button>
      ) : (
        <form onSubmit={handleDelete} className="mt-3 space-y-3">
          {usesPassword ? (
            <div>
              <label htmlFor="delpw" className="text-sm font-bold">
                Your password
              </label>
              <input
                id="delpw"
                type="password"
                autoComplete="current-password"
                className={`${inputCls} mt-1`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          ) : (
            <p className="text-sm opacity-80">
              You signed in with Google, so a Google window will open to confirm it is you.
            </p>
          )}

          <div>
            <label htmlFor="delconfirm" className="text-sm font-bold">
              Type DELETE to confirm
            </label>
            <input
              id="delconfirm"
              autoComplete="off"
              className={`${inputCls} mt-1`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              disabled={busy}
              className="w-full rounded-full bg-red-500 py-3 font-bold text-white transition hover:brightness-95 disabled:opacity-60"
            >
              {busy ? 'Deleting...' : 'Delete everything'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false)
                setError('')
              }}
              className="w-full rounded-full border-2 border-sage py-3 font-bold disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

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
      <Link to="/more" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to More
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

      {/* privacy */}
      <Link
        to="/privacy"
        className={`mt-4 flex items-center justify-between ${card} font-bold`}
      >
        <span>🔒 Privacy note</span>
        <span aria-hidden="true" className="text-xl opacity-40">
          ›
        </span>
      </Link>

      <DeleteAccount />
    </div>
  )
}