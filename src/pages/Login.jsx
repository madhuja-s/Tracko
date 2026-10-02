import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { ensureProfile } from '../services/userService'
import { friendlyError } from '../utils/authErrors'
import AuthLayout from '../components/AuthLayout'
import { inputCls, btnCls, btnOutlineCls } from '../styles'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user?.emailVerified) return <Navigate to="/" replace />

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setBusy(true)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      await ensureProfile(cred.user)
      navigate('/')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Welcome back 🌸" subtitle="Log in to continue your routine">
      <form onSubmit={handleLogin} className="space-y-4">
        <input className={inputCls} type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputCls} type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className={btnCls} disabled={busy}>
          {busy ? 'Please wait...' : 'Log in'}
        </button>
      </form>

      <button onClick={handleGoogle} disabled={busy} className={`${btnOutlineCls} mt-3`}>
        Continue with Google
      </button>

      <div className="mt-6 flex justify-between text-sm">
        <Link to="/forgot" className="text-deepsage dark:text-sage font-bold">Forgot password?</Link>
        <Link to="/signup" className="text-deepsage dark:text-sage font-bold">Create account</Link>
      </div>
    </AuthLayout>
  )
}