import { useState } from 'react'
import { useVault } from '../../context/VaultContext'
import { inputCls, btnCls } from '../../styles'

function strength(p) {
  let score = 0
  if (p.length >= 10) score++
  if (p.length >= 14) score++
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return Math.min(score, 4)
}

const LEVELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong']

export default function VaultSetup({ onCreated }) {
  const { setup } = useVault()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const level = pw.length < 10 ? 0 : Math.max(1, strength(pw))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (pw.length < 10) return setError('Use at least 10 characters.')
    if (pw !== pw2) return setError('The two passwords do not match.')
    if (!understood) return setError('Please tick the box to continue.')

    setBusy(true)
    try {
      const recoveryKey = await setup(pw)
      onCreated({ recoveryKey, password: pw })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not create the vault. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-4"
    >
      <h2 className="font-bold">Create your vault</h2>
      <p className="text-sm opacity-80">
        Your vault has its own password. Everything inside is locked on your device before it
        is saved, so nobody else can read it, including the people who run the database.
      </p>

      <div>
        <label htmlFor="vpw" className="text-sm font-bold">
          Vault password
        </label>
        <input
          id="vpw"
          type="password"
          autoComplete="new-password"
          className={`${inputCls} mt-1`}
          placeholder="At least 10 characters"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {pw && (
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-white/70 dark:bg-dark-bg">
              <div
                className={`h-full transition-all ${level <= 1 ? 'bg-red-400' : level === 2 ? 'bg-blush' : 'bg-sage'}`}
                style={{ width: `${(level / 4) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs opacity-70">{LEVELS[level]}</p>
          </div>
        )}
        <p className="mt-1 text-xs opacity-70">
          Tip: a few random words, like "teacup-mango-river-lantern", is strong and easy to
          remember. Don't reuse your login password.
        </p>
      </div>

      <div>
        <label htmlFor="vpw2" className="text-sm font-bold">
          Type it again
        </label>
        <input
          id="vpw2"
          type="password"
          autoComplete="new-password"
          className={`${inputCls} mt-1`}
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-white/60 dark:bg-dark-bg px-4 py-3 text-sm">
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <span>
          I understand that if I lose <b>both</b> my vault password and my recovery key, my
          vault can <b>never</b> be opened again.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={btnCls} disabled={busy}>
        {busy ? 'Creating (this takes a moment)...' : 'Create vault'}
      </button>
    </form>
  )
}