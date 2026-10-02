import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-deepsage font-semibold">Loading... 🌸</p>
    </div>
  )
}

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (!user.emailVerified) return <Navigate to="/verify" replace />
  if (!profile) return <Loading />
  if (requireOnboarding && !profile.onboardingDone) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}