import { useState } from 'react'
import { useVault } from '../../context/VaultContext'
import { inputCls, btnCls } from '../../styles'

export default function VaultUnlock() {
  const { unlock, resetWithRecovery } = useVault()
  const [mode, setMode] = useState('password')

  const [pw, setPw] = useState('')
  const [rk, setRk] = useState('')
  const [npw, setNpw] = useState('')
  const [npw2, setNpw2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleUnlock(e) {
    e.preventDefault()
    setError('')
    if (!pw) return setError('Enter your vault password.')
    setBusy(true)
    try {
      await unlock(pw)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    if (!rk.trim()) return setError('Enter your recovery key.')
    if (npw.length < 10) return setError('Your new password needs at least 10 characters.')
    if (npw !== npw2) return setError('The two new passwords do not match.')
    setBusy(true)
    try {
      await resetWithRecovery(rk, npw)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (mode === 'recovery') {
    return (
      <form
        onSubmit={handleReset}
        className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-3"
      >
        <h2 className="font-bold">Use your recovery key</h2>
        <p className="text-sm opacity-80">
          Enter the key you saved when you made the vault, then choose a new vault password. Your
          items stay safe.
        </p>

        <div>
          <label htmlFor="rk" className="text-sm font-bold">
            Recovery key
          </label>
          <input
            id="rk"
            autoComplete="off"
            className={`${inputCls} mt-1 uppercase`}
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
            value={rk}
            onChange={(e) => setRk(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="npw" className="text-sm font-bold">
            New vault password
          </label>
          <input
            id="npw"
            type="password"
            autoComplete="new-password"
            className={`${inputCls} mt-1`}
            value={npw}
            onChange={(e) => setNpw(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="npw2" className="text-sm font-bold">
            Type it again
          </label>
          <input
            id="npw2"
            type="password"
            autoComplete="new-password"
            className={`${inputCls} mt-1`}
            value={npw2}
            onChange={(e) => setNpw2(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={btnCls} disabled={busy}>
          {busy ? 'Working (this takes a moment)...' : 'Set new password and open'}
        </button>
        <button
          type="button"
          onClick={() => {
            setError('')
            setMode('password')
          }}
          className="block w-full text-center text-sm font-bold text-deepsage dark:text-sage"
        >
          ← Back
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={handleUnlock}
      className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-3"
    >
      <h2 className="font-bold">Your vault is locked 🔒</h2>
      <div>
        <label htmlFor="upw" className="text-sm font-bold">
          Vault password
        </label>
        <input
          id="upw"
          type="password"
          autoComplete="current-password"
          className={`${inputCls} mt-1`}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={btnCls} disabled={busy}>
        {busy ? 'Unlocking...' : 'Unlock'}
      </button>
      <button
        type="button"
        onClick={() => {
          setError('')
          setMode('recovery')
        }}
        className="block w-full text-center text-sm font-bold text-deepsage dark:text-sage"
      >
        Forgot your vault password?
      </button>
    </form>
  )
}