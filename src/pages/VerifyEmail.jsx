import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { sendEmailVerification, deleteUser } from 'firebase/auth'
import { doc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { ensureProfile } from '../services/userService'
import AuthLayout from '../components/AuthLayout'
import { btnCls, btnOutlineCls } from '../styles'

function sendErrorText(err) {
  const code = err?.code || ''
  if (code === 'auth/too-many-requests') {
    return 'Too many emails were requested. Please wait a while (up to an hour) and try again.'
  }
  if (code === 'auth/network-request-failed') {
    return 'No internet connection. Please check it and try again.'
  }
  return `Could not send the email${code ? ` (${code})` : ''}. Please try again in a moment.`
}

const MSG_STYLE = {
  ok: 'bg-sage/30 text-deepsage dark:text-sage',
  info: 'bg-white/60 dark:bg-dark-bg',
  warn: 'bg-blush text-charcoal',
}

export default function VerifyEmail() {
  const { user, loading, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [msg, setMsg] = useState(
    location.state?.sendFailed
      ? {
          kind: 'warn',
          text: 'We could not send the first email. Tap "Resend email" below.',
        }
      : null,
  )
  const [cooldown, setCooldown] = useState(0)
  const [busy, setBusy] = useState(false)

  // the resend button waits 60 seconds between emails
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // move on by itself as soon as the link has been clicked
  useEffect(() => {
    if (!user || user.emailVerified) return

    let cancelled = false
    const check = () => {
      refreshUser(ensureProfile)
        .then((ok) => {
          if (ok && !cancelled) navigate('/', { replace: true })
        })
        .catch(() => {})
    }

    const id = setInterval(check, 4000)
    window.addEventListener('focus', check)
    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener('focus', check)
    }
  }, [user, navigate, refreshUser])

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.emailVerified) return <Navigate to="/" replace />

  async function checkNow() {
    setBusy(true)
    setMsg(null)
    try {
      const ok = await refreshUser(ensureProfile)
      if (ok) return navigate('/', { replace: true })
      setMsg({
        kind: 'info',
        text: 'Not verified yet. Click the link in the email first, then come back.',
      })
    } catch (err) {
      console.error(err)
      setMsg({ kind: 'warn', text: 'Could not check. Please try again.' })
    }
    setBusy(false)
  }

  async function resend() {
    if (cooldown > 0) return
    setMsg(null)
    try {
      await sendEmailVerification(auth.currentUser)
      setCooldown(60)
      setMsg({
        kind: 'ok',
        text: `Email sent to ${user.email}. It can take a few minutes. Check your spam folder too.`,
      })
    } catch (err) {
      console.error(err)
      if (err?.code === 'auth/too-many-requests') setCooldown(120)
      setMsg({ kind: 'warn', text: sendErrorText(err) })
    }
  }

  async function startOver() {
    const ok = window.confirm(
      'Delete this unverified account, so you can sign up again with the right email?',
    )
    if (!ok) return

    setBusy(true)
    setMsg(null)
    try {
      const u = auth.currentUser
      try {
        await deleteDoc(doc(db, 'users', u.uid))
      } catch (err) {
        console.error(err)
      }
      await deleteUser(u)
      navigate('/signup', { replace: true })
    } catch (err) {
      console.error(err)
      setMsg({
        kind: 'warn',
        text: 'For safety, please log out, log in again, and then try this once more.',
      })
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email 📩"
      subtitle={`We sent a link to ${user.email}. Click it, and this page moves on by itself.`}
    >
      <div className="space-y-3">
        <div className="rounded-2xl bg-white/60 dark:bg-dark-bg px-4 py-3 text-sm">
          <p className="font-bold">Can't find it?</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 opacity-90">
            <li>Check <b>Spam</b>, <b>Junk</b> and <b>Promotions</b>.</li>
            <li>Look for a sender that starts with <b>tracko</b>.</li>
            <li>College and work emails often block it. A Gmail address works best.</li>
          </ul>
        </div>

        <button className={btnCls} onClick={checkNow} disabled={busy}>
          I have verified
        </button>
        <button className={btnOutlineCls} onClick={resend} disabled={busy || cooldown > 0}>
          {cooldown > 0 ? `Resend email (wait ${cooldown}s)` : 'Resend email'}
        </button>

        {msg && (
          <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${MSG_STYLE[msg.kind]}`}>
            {msg.text}
          </p>
        )}

        <div className="flex items-center justify-between pt-1 text-sm">
          <button
            onClick={startOver}
            disabled={busy}
            className="font-bold text-deepsage underline dark:text-sage"
          >
            Wrong email? Start over
          </button>
          <button onClick={logout} className="underline opacity-70">
            Log out
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}