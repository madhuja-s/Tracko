import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// width of the strip on the right edge of the page
export const TAB_STRIP = 50

const HIDDEN_ON = ['/login', '/signup', '/forgot', '/verify', '/onboarding']

// the tabs only show when you are logged in and set up
export function useShowNav() {
  const { user, profile } = useAuth()
  const { pathname } = useLocation()
  return (
    !!user && user.emailVerified && !!profile?.onboardingDone && !HIDDEN_ON.includes(pathname)
  )
}

const icon = {
  className: 'h-5 w-5',
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

// soft tints for the tabs that are tucked in, so they alternate like a real diary
const TUCKED = ['bg-sage/45', 'bg-blush/45']

export default function SideTabs() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Main"
      className="absolute right-0 z-30"
      style={{ top: 56, width: TAB_STRIP }}
    >
      <ul className="flex flex-col gap-1.5">
        {TABS.map((t, i) => {
          const active = t.match(pathname)
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                aria-label={t.label}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-2 rounded-r-2xl text-charcoal shadow-[2px_3px_6px_rgba(59,55,53,0.16)] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepsage ${
                  active
                    ? 'bg-blush'
                    : `${TUCKED[i % 2]} hover:brightness-95 dark:text-cream`
                }`}
                style={{
                  width: active ? TAB_STRIP : 36,
                  height: 'clamp(72px, 11dvh, 96px)',
                }}
              >
                {t.svg}
                <span
                  className={`text-[11px] tracking-wide [writing-mode:vertical-rl] ${
                    active ? 'font-extrabold' : 'font-bold'
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