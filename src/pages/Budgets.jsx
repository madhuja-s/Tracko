import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCategories, useTransactions } from '../hooks/useFinance'
import { useBudgets } from '../hooks/useBudgets'
import { todayInZone } from '../utils/dates'
import {
  monthStartFor,
  nextMonthStart,
  prevMonthStart,
  monthEndFor,
  rangeLabel,
} from '../utils/financeMonth'
import { money, round2 } from '../utils/money'
import { saveBudget, removeBudget } from '../services/budgetService'
import { inputCls, btnCls } from '../styles'

function BudgetBar({ label, spent, limit, onEdit, onRemove }) {
  const pct = limit > 0 ? (spent / limit) * 100 : 0
  const over = spent > limit
  const barColor = over ? 'bg-red-400' : pct >= 75 ? 'bg-blush' : 'bg-sage'

  return (
    <div className="rounded-2xl bg-white/60 dark:bg-dark-bg px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{label}</p>
        <p className="text-sm">
          {money(spent)} <span className="opacity-60">of {money(limit)}</span>
        </p>
      </div>

      <div className="mt-2 h-3 rounded-full bg-softblush dark:bg-dark-card overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className={`text-xs font-semibold ${over ? 'text-red-600' : 'opacity-70'}`}>
          {over
            ? `Over by ${money(round2(spent - limit))}`
            : `${money(round2(limit - spent))} left`}
        </p>
        <div className="flex gap-4 text-xs font-bold">
          <button onClick={onEdit} className="text-deepsage dark:text-sage">
            Edit
          </button>
          <button onClick={onRemove} className="text-red-600">
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Budgets() {
  const { user, profile } = useAuth()
  const today = todayInZone(profile?.timeZone)
  const startDay = profile?.financeMonthStart ?? 1

  const [viewStart, setViewStart] = useState(() => monthStartFor(today, startDay))
  const viewEnd = monthEndFor(viewStart)
  const isCurrent = viewStart >= monthStartFor(today, startDay)

  const { categories } = useCategories(user.uid)
  const items = useTransactions(user.uid, viewStart, viewEnd)
  const budgets = useBudgets(user.uid)

  const [target, setTarget] = useState('overall')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const expenseCats = categories.filter((c) => c.type === 'expense')

  const { totalSpent, spentById } = useMemo(() => {
    const byId = {}
    let total = 0
    items
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        total += t.amount
        byId[t.categoryId] = (byId[t.categoryId] || 0) + t.amount
      })
    return { totalSpent: round2(total), spentById: byId }
  }, [items])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setMsg('')

    const value = Number(amount)
    if (!amount || !Number.isFinite(value) || value <= 0) {
      return setError('Enter a limit more than 0.')
    }

    setBusy(true)
    try {
      await saveBudget(user.uid, target, round2(value))
      setAmount('')
      setMsg('Budget saved ✓')
    } catch (err) {
      console.error(err)
      setError('Could not save. Please try again.')
    }
    setBusy(false)
  }

  function startEdit(id) {
    setError('')
    setMsg('')
    setTarget(id)
    setAmount(String(budgets[id]))
  }

  async function handleRemove(id, label) {
    if (window.confirm(`Remove the budget for "${label}"?`)) {
      await removeBudget(user.uid, id)
    }
  }

  const budgetedCats = expenseCats.filter((c) => budgets[c.id] !== undefined)

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <Link to="/money" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to money
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Budgets 🎯
      </h1>

      {/* month switcher */}
      <div className="mt-4 flex items-center justify-between">
        <button
          aria-label="Previous month"
          onClick={() => setViewStart(prevMonthStart(viewStart))}
          className="h-11 w-11 rounded-full bg-softblush dark:bg-dark-card text-xl font-bold"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-bold">{rangeLabel(viewStart, viewEnd)}</p>
          <p className="text-xs opacity-70">{isCurrent ? 'This month' : 'Past month'}</p>
        </div>
        <button
          aria-label="Next month"
          disabled={isCurrent}
          onClick={() => setViewStart(nextMonthStart(viewStart))}
          className="h-11 w-11 rounded-full bg-softblush dark:bg-dark-card text-xl font-bold disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {/* overall budget */}
      <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
        <h2 className="font-bold">Overall budget</h2>
        <div className="mt-3">
          {budgets.overall !== undefined ? (
            <BudgetBar
              label="All spending"
              spent={totalSpent}
              limit={budgets.overall}
              onEdit={() => startEdit('overall')}
              onRemove={() => handleRemove('overall', 'Overall')}
            />
          ) : (
            <p className="text-sm opacity-70">
              No overall limit yet. Set one below to cap your whole month.
            </p>
          )}
        </div>
      </div>

      {/* category budgets */}
      <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
        <h2 className="font-bold">Category budgets</h2>
        <div className="mt-3 space-y-3">
          {budgetedCats.length === 0 && (
            <p className="text-sm opacity-70">
              No category budgets yet. Pick a category below and set a limit.
            </p>
          )}
          {budgetedCats.map((c) => (
            <BudgetBar
              key={c.id}
              label={c.name}
              spent={round2(spentById[c.id] || 0)}
              limit={budgets[c.id]}
              onEdit={() => startEdit(c.id)}
              onRemove={() => handleRemove(c.id, c.name)}
            />
          ))}
        </div>
      </div>

      {/* set / change a budget */}
      <form
        onSubmit={handleSave}
        className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-3"
      >
        <h2 className="font-bold">Set or change a budget</h2>

        <div>
          <label htmlFor="bt" className="text-sm font-bold">
            For
          </label>
          <select
            id="bt"
            className={`${inputCls} mt-1`}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="overall">Overall (all spending)</option>
            {expenseCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ba" className="text-sm font-bold">
            Monthly limit (₹)
          </label>
          <input
            id="ba"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="e.g. 3000"
            className={`${inputCls} mt-1`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="mt-1 text-xs opacity-70">
            The same limit applies to every finance month.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && (
          <p className="text-sm font-semibold text-deepsage dark:text-sage">{msg}</p>
        )}
        <button className={btnCls} disabled={busy}>
          {busy ? 'Saving...' : 'Save budget'}
        </button>
      </form>
    </div>
  )
}