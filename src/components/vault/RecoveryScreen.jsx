import { useState } from 'react'
import { useVault } from '../../context/VaultContext'
import { downloadFile } from '../../utils/csv'
import { btnCls, btnOutlineCls } from '../../styles'

export default function RecoveryScreen({ recoveryKey, password, onDone }) {
  const { unlock } = useVault()
  const [saved, setSaved] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function copy() {
    try {
      await navigator.clipboard.writeText(recoveryKey)
      setNote('Copied. Paste it somewhere safe now, then clear your clipboard.')
    } catch {
      setNote('Could not copy. Please write the key down by hand instead.')
    }
  }

  function download() {
    downloadFile(
      'tracko-vault-recovery-key.txt',
      `Tracko vault recovery key\r\n\r\n${recoveryKey}\r\n\r\nKeep this file private and safe. Anyone with this key and access to your account can open your vault.\r\n`,
      'text/plain',
    )
    setNote('Downloaded. Move the file somewhere safe, like a password manager or a USB drive.')
  }

  async function finish() {
    setError('')
    setBusy(true)
    try {
      await unlock(password)
      onDone()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-4">
      <h2 className="font-bold">Save your recovery key 🗝️</h2>
      <p className="text-sm opacity-80">
        If you forget your vault password, this key is the <b>only</b> way back in. You will not
        be shown it again.
      </p>

      <p
        className="select-all break-words rounded-2xl bg-white/70 dark:bg-dark-bg px-4 py-4 text-center text-xl font-extrabold tracking-wider text-deepsage dark:text-sage"
        style={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }}
      >
        {recoveryKey}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={btnOutlineCls} onClick={copy}>
          Copy
        </button>
        <button type="button" className={btnOutlineCls} onClick={download}>
          Download
        </button>
      </div>
      {note && <p className="text-sm font-semibold text-deepsage dark:text-sage">{note}</p>}

      <label className="flex items-start gap-3 rounded-2xl bg-white/60 dark:bg-dark-bg px-4 py-3 text-sm">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <span>I have saved my recovery key in a safe place.</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={btnCls} disabled={!saved || busy} onClick={finish}>
        {busy ? 'Opening your vault...' : 'Open my vault'}
      </button>
    </div>
  )
}