import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, profile, logout } = useAuth()

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-8">
        <h1 className="text-2xl font-extrabold text-deepsage dark:text-sage">
          Hi {profile?.name || user.displayName || 'there'} 🌸
        </h1>
        <p className="mt-2">You are logged in as {user.email}.</p>
        <p className="mt-1 opacity-70 text-sm">
          Your daily routine will show up here soon.
        </p>
        <button
          onClick={logout}
          className="mt-6 rounded-full bg-blush text-charcoal font-bold px-6 py-2"
        >
          Log out
        </button>
      </div>
    </div>
  )
}