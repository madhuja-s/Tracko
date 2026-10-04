import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useVault } from '../context/VaultContext'
import VaultSetup from '../components/vault/VaultSetup'
import RecoveryScreen from '../components/vault/RecoveryScreen'
import VaultUnlock from '../components/vault/VaultUnlock'
import VaultItems from '../components/vault/VaultItems'

export default function Vault() {
  const { status, lock } = useVault()
  const [fresh, setFresh] = useState(null) // { recoveryKey, password } right after creating

  let body
  if (fresh) {
    body = (
      <RecoveryScreen
        recoveryKey={fresh.recoveryKey}
        password={fresh.password}
        onDone={() => setFresh(null)}
      />
    )
  } else if (status === 'loading') {
    body = <p className="mt-6 font-semibold text-deepsage">Loading... 🌸</p>
  } else if (status === 'error') {
    body = (
      <p className="mt-6 rounded-2xl bg-blush px-4 py-3 text-sm font-semibold text-charcoal">
        Could not reach your vault. Please check your internet and refresh the page.
      </p>
    )
  } else if (status === 'new') {
    body = <VaultSetup onCreated={setFresh} />
  } else if (status === 'locked') {
    body = <VaultUnlock />
  } else if (status === 'unlocked') {
    body = <VaultItems />
  } else {
    body = null
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm font-bold text-deepsage dark:text-sage">
          ← Back to today
        </Link>
        {status === 'unlocked' && !fresh && (
          <button
            onClick={lock}
            className="rounded-full border-2 border-sage px-4 py-1 text-sm font-bold text-deepsage dark:text-sage"
          >
            🔒 Lock now
          </button>
        )}
      </div>

      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">Vault 🔐</h1>
      <p className="text-sm opacity-70">Private notes and secret goals, locked just for you.</p>

      {body}
    </div>
  )
}