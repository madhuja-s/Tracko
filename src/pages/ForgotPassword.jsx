import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import { friendlyError } from '../utils/authErrors'
import AuthLayout from '../components/AuthLayout'
import { inputCls, btnCls } from '../styles'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    setBusy(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setMsg('If this email has an account, a reset link is on its way.')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="We will email you a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className={inputCls} type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-deepsage dark:text-sage">{msg}</p>}
        <button className={btnCls} disabled={busy}>Send reset link</button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="text-deepsage dark:text-sage font-bold">Back to login</Link>
      </p>
    </AuthLayout>
  )
}