import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { createUserProfile } from '../services/userService'
import { friendlyError } from '../utils/authErrors'
import AuthLayout from '../components/AuthLayout'
import { inputCls, btnCls } from '../styles'

export default function Signup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user?.emailVerified) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const ageNum = Number(age)
    if (!name.trim()) return setError('Please enter your name.')
    if (!ageNum || ageNum < 10 || ageNum > 100)
      return setError('Please enter a valid age.')
    if (password.length < 8)
      return setError('Password must be at least 8 characters.')

    setBusy(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)

      // send the email first, so nothing later can stop it
      let sendFailed = false
      try {
        await sendEmailVerification(cred.user)
      } catch (err) {
        console.error('Could not send the verification email:', err)
        sendFailed = true
      }

      // the profile can be finished later if this step fails
      try {
        await updateProfile(cred.user, { displayName: name.trim() })
        await createUserProfile(cred.user, { name: name.trim(), age: ageNum })
      } catch (err) {
        console.error('Could not save the profile yet:', err)
      }

      navigate('/verify', { state: { sendFailed } })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Let's build your routine 🌱">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className={inputCls} placeholder="Your name" value={name}
          onChange={(e) => setName(e.target.value)} />
        <input className={inputCls} type="number" placeholder="Your age" value={age}
          onChange={(e) => setAge(e.target.value)} />
        <input className={inputCls} type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputCls} type="password" placeholder="Password (min 8 characters)"
          value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className={btnCls} disabled={busy}>
          {busy ? 'Creating...' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-deepsage dark:text-sage font-bold">Log in</Link>
      </p>
    </AuthLayout>
  )
}