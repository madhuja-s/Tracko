import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const HIDDEN_ON = ['/login', '/signup', '/forgot', '/verify', '/onboarding']

// the bar only shows when you are logged in and set up
export function useShowNav() {
  const { user, profile } = useAuth()
  const { pathname } = useLocation()
  return (
    !!user && user.emailVerified && !!profile?.onboardingDone && !HIDDEN_ON.includes(pathname)
  )
}

const icon = {
  className: 'h-6 w-6',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const TABS = [
  {
    to: '/',
    label: 'Today',
    match: (p) => p === '/' || p.startsWith('/routine') || p.startsWith('/goals'),
    svg: (
      <svg {...icon}>
        <rect x="5" y="4.5" width="14" height="16" rx="3" />
        <path d="M9 2.5v4M15 2.5v4" />
        <path d="M9 13.2l2.2 2.2 4.3-4.6" />
      </svg>
    ),
  },
  {
    to: '/money',
    label: 'Money',
    match: (p) => p.startsWith('/money'),
    svg: (
      <svg {...icon}>
        <path d="M4.5 8V6.8A1.8 1.8 0 0 1 6.3 5H17a1 1 0 0 1 1 1v2" />
        <rect x="4" y="8" width="16" height="11" rx="2.6" />
        <circle cx="16" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    to: '/insights',
    label: 'Insights',
    match: (p) => p.startsWith('/insights'),
    svg: (
      <svg {...icon}>
        <path d="M5 20v-9M12 20V5M19 20v-6" />
      </svg>
    ),
  },
  {
    to: '/vault',
    label: 'Vault',
    match: (p) => p.startsWith('/vault'),
    svg: (
      <svg {...icon}>
        <rect x="5" y="10.5" width="14" height="10" rx="2.6" />
        <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
      </svg>
    ),
  },
  {
    to: '/more',
    label: 'More',
    match: (p) =>
      p.startsWith('/more') ||
      p.startsWith('/settings') ||
      p.startsWith('/appearance') ||
      p.startsWith('/account'),
    svg: (
      <svg {...icon}>
        <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Main"
      className="absolute bottom-0 left-[26px] right-0 z-30 border-t border-blush/60 bg-cream/95 backdrop-blur dark:bg-dark-bg/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch px-1">
        {TABS.map((t) => {
          const active = t.match(pathname)
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                aria-current={active ? 'page' : undefined}
                className="flex h-full flex-col items-center justify-center gap-0.5"
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                    active
                      ? 'bg-blush text-charcoal'
                      : 'text-charcoal/60 dark:text-cream/60'
                  }`}
                >
                  {t.svg}
                </span>
                <span
                  className={`text-[11px] font-bold ${
                    active ? 'text-deepsage dark:text-sage' : 'opacity-70'
                  }`}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}