import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import { btnCls, btnOutlineCls } from '../styles'

export default function VerifyEmail() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.emailVerified) return <Navigate to="/" replace />

  async function checkVerified() {
    setBusy(true)
    setMsg('')
    await auth.currentUser.reload()
    if (auth.currentUser.emailVerified) {
      navigate('/')
    } else {
      setMsg('Not verified yet. Click the link in your email first.')
    }
    setBusy(false)
  }

  async function resend() {
    setMsg('')
    try {
      await sendEmailVerification(auth.currentUser)
      setMsg('Email sent again. Check inbox and spam.')
    } catch {
      setMsg('Please wait a minute before asking again.')
    }
  }

  return (
    <AuthLayout
      title="Verify your email 📩"
      subtitle={`We sent a link to ${user.email}. Click it, then come back here.`}
    >
      <div className="space-y-3">
        <button className={btnCls} onClick={checkVerified} disabled={busy}>
          I have verified
        </button>
        <button className={btnOutlineCls} onClick={resend}>Resend email</button>
        <button className="w-full text-sm underline" onClick={logout}>
          Use a different account
        </button>
        {msg && <p className="text-sm text-center">{msg}</p>}
      </div>
    </AuthLayout>
  )
}