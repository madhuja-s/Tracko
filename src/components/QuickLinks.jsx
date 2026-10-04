import { Link } from 'react-router-dom'

const LINKS = [
  ['/insights', '📊 Insights'],
  ['/settings', '⏰ Reminders'],
  ['/appearance', '🎨 Colours'],
  ['/account', '👤 Account'],
]

export default function QuickLinks() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-deepsage dark:text-sage">
      {LINKS.map(([to, label]) => (
        <Link key={to} to={to}>
          {label}
        </Link>
      ))}
    </div>
  )
}