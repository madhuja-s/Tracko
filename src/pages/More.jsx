import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GROUPS = [
  {
    title: 'Your routine',
    rows: [
      ['/routine', '✏️', 'Edit routine', 'Add, change or remove tasks'],
      ['/goals', '🎯', 'Goals & progress', 'Weekly and monthly goals'],
      ['/settings', '⏰', 'Reminders', 'Pick your daily reminder time'],
    ],
  },
  {
    title: 'Make it yours',
    rows: [
      ['/appearance', '🎨', 'Colours', 'Palette, light and dark mode'],
      ['/account', '👤', 'Account & data', 'Install the app, download your data'],
    ],
  },
]

export default function More() {
  const { user, profile, logout } = useAuth()

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-8">
      <h1 className="text-2xl font-extrabold text-deepsage dark:text-sage">More</h1>
      <p className="text-sm opacity-70">
        {profile?.name || user.displayName || 'You'} · {user.email}
      </p>

      {GROUPS.map((g) => (
        <section key={g.title} className="mt-6">
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest opacity-60">
            {g.title}
          </h2>
          <div className="divide-y divide-blush/40 rounded-3xl bg-softblush p-2 shadow-sm dark:bg-dark-card">
            {g.rows.map(([to, emoji, title, hint]) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-4 rounded-2xl px-3 py-3.5 transition hover:bg-white/50 dark:hover:bg-dark-bg/60"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 text-lg dark:bg-dark-bg"
                >
                  {emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{title}</span>
                  <span className="block truncate text-xs opacity-70">{hint}</span>
                </span>
                <span aria-hidden="true" className="text-xl opacity-40">
                  ›
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <button
        onClick={logout}
        className="mt-6 block w-full rounded-full border-2 border-sage py-3 text-center font-bold text-deepsage dark:text-sage"
      >
        Log out
      </button>

      <p className="mt-6 text-center text-xs opacity-50">Tracko</p>
    </div>
  )
}