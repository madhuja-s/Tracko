import { Link } from 'react-router-dom'

const LINKS = [
  ['/money/budgets', '🎯 Budgets'],
  ['/money/savings', '🐷 Savings'],
  ['/money/bills', '🧾 Bills'],
  ['/money/settings', '⚙️ Categories & month'],
]

export default function MoneyNav() {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {LINKS.map(([to, label]) => (
        <Link
          key={to}
          to={to}
          className="rounded-full border-2 border-sage px-3 py-1 text-sm font-bold text-deepsage dark:text-sage"
        >
          {label}
        </Link>
      ))}
    </div>
  )
}