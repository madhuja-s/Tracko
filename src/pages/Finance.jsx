import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCategories, useTransactions } from '../hooks/useFinance'
import { todayInZone, shortDate } from '../utils/dates'
import {
  monthStartFor,
  nextMonthStart,
  prevMonthStart,
  monthEndFor,
  rangeLabel,
} from '../utils/financeMonth'
import { money, round2 } from '../utils/money'
import { addTransaction, deleteTransaction } from '../services/financeService'
import { inputCls, btnCls } from '../styles'

export default function Finance() {
  const { user, profile } = useAuth()
  const today = todayInZone(profile?.timeZone)
  const startDay = profile?.financeMonthStart ?? 1

  const [viewStart, setViewStart] = useState(() => monthStartFor(today, startDay))
  const viewEnd = monthEndFor(viewStart)
  const currentStart = monthStartFor(today, startDay)
  const isCurrent = viewStart >= currentStart

  const { categories } = useCategories(user.uid)
  const items = useTransactions(user.uid, viewStart, viewEnd)

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const catList = categories.filter((c) => c.type === type)
  const chosen = catList.find((c) => c.id === categoryId) || catList[0]

  function nameOf(t) {
    return categories.find((c) => c.id === t.categoryId)?.name || t.categoryName || 'Other'
  }

  const totals = useMemo(() => {
    let income = 0
    let spent = 0
    items.forEach((t) => {
      if (t.type === 'income') income += t.amount
      else spent += t.amount
    })
    return { income: round2(income), spent: round2(spent), balance: round2(income - spent) }
  }, [items])

  const byCategory = useMemo(() => {
    const map = {}
    items
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const name =
          categories.find((c) => c.id === t.categoryId)?.name || t.categoryName || 'Other'
        map[name] = (map[name] || 0) + t.amount
      })
    return Object.entries(map)
      .map(([name, total]) => ({ name, total: round2(total) }))
      .sort((a, b) => b.total - a.total)
  }, [items, categories])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setMsg('')

    const value = Number(amount)
    if (!amount || !Number.isFinite(value) || value <= 0) {
      return setError('Enter an amount more than 0.')
    }
    if (!chosen) return setError('Pick a category.')
    if (!date) return setError('Pick a date.')

    setBusy(true)
    try {
      await addTransaction(user.uid, {
        type,
        amount: round2(value),
        categoryId: chosen.id,
        categoryName: chosen.name,
        date,
        note,
      })
      setAmount('')
      setNote('')
      const inView = date >= viewStart && date <= viewEnd
      setMsg(inView ? 'Added ✓' : 'Added ✓ (it belongs to a different month)')
    } catch (err) {
      console.error(err)
      setError('Could not save. Please try again.')
    }
    setBusy(false)
  }

  async function handleDelete(t) {
    if (window.confirm(`Delete this ${money(t.amount)} entry?`)) {
      await deleteTransaction(user.uid, t.id)
    }
  }

  const maxCat = byCategory[0]?.total || 1

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <Link to="/" className="text-sm font-bold text-deepsage dark:text-sage">
          ← Back to today
        </Link>
        <div className="flex flex-wrap justify-end gap-x-4 gap-y-1">
          <Link
            to="/money/budgets"
            className="text-sm font-bold text-deepsage dark:text-sage"
          >
            Budgets
          </Link>
          <Link
            to="/money/savings"
            className="text-sm font-bold text-deepsage dark:text-sage"
          >
            Savings
          </Link>
          <Link
            to="/money/settings"
            className="text-sm font-bold text-deepsage dark:text-sage"
          >
            Categories & month
          </Link>
        </div>
      </div>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Money 💰
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

      {/* totals */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-xs opacity-70">Income</p>
          <p className="mt-1 font-extrabold text-deepsage dark:text-sage">
            {money(totals.income)}
          </p>
        </div>
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-xs opacity-70">Spent</p>
          <p className="mt-1 font-extrabold">{money(totals.spent)}</p>
        </div>
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-xs opacity-70">Balance</p>
          <p
            className={`mt-1 font-extrabold ${
              totals.balance < 0 ? 'text-red-600' : 'text-deepsage dark:text-sage'
            }`}
          >
            {money(totals.balance)}
          </p>
        </div>
      </div>

      {/* add form */}
      <form
        onSubmit={handleAdd}
        className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-3"
      >
        <h2 className="font-bold">Add an entry</h2>

        <div className="flex gap-2">
          {['expense', 'income'].map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => {
                setType(tp)
                setCategoryId('')
              }}
              className={`flex-1 rounded-full py-2 text-sm font-bold border-2 transition ${
                type === tp ? 'bg-blush border-blush text-charcoal' : 'border-sage/60'
              }`}
            >
              {tp === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="amt" className="text-sm font-bold">
            Amount (₹)
          </label>
          <input
            id="amt"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            className={`${inputCls} mt-1`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="cat" className="text-sm font-bold">
            Category
          </label>
          <select
            id="cat"
            className={`${inputCls} mt-1`}
            value={chosen?.id || ''}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {catList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dt" className="text-sm font-bold">
            Date
          </label>
          <input
            id="dt"
            type="date"
            className={`${inputCls} mt-1`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="nt" className="text-sm font-bold">
            Note (optional)
          </label>
          <input
            id="nt"
            className={`${inputCls} mt-1`}
            placeholder="e.g. Lunch with friends"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && (
          <p className="text-sm font-semibold text-deepsage dark:text-sage">{msg}</p>
        )}
        <button className={btnCls} disabled={busy}>
          {busy ? 'Saving...' : 'Add entry'}
        </button>
      </form>

      {/* where the money went */}
      {byCategory.length > 0 && (
        <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
          <h2 className="font-bold">Where your money went</h2>
          <div className="mt-3 space-y-3">
            {byCategory.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{c.name}</span>
                  <span>{money(c.total)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/70 dark:bg-dark-bg overflow-hidden">
                  <div
                    className="h-full bg-sage"
                    style={{ width: `${Math.round((c.total / maxCat) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* list */}
      <div className="mt-4 space-y-2 pb-6">
        <h2 className="font-bold">Entries this month</h2>
        {items.length === 0 && (
          <p className="text-sm opacity-70">Nothing yet. Add your first entry above.</p>
        )}
        {items.map((t) => {
          const income = t.type === 'income'
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-2xl bg-softblush dark:bg-dark-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{nameOf(t)}</p>
                <p className="text-xs opacity-70 truncate">
                  {shortDate(t.date)}
                  {t.note ? ` · ${t.note}` : ''}
                </p>
              </div>
              <p
                className={`font-bold ${income ? 'text-deepsage dark:text-sage' : ''}`}
              >
                {income ? '+' : '−'}
                {money(t.amount)}
              </p>
              <button
                onClick={() => handleDelete(t)}
                aria-label="Delete entry"
                className="px-2 text-sm font-bold text-red-600"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}