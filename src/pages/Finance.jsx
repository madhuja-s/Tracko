import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCategories, useTransactions } from '../hooks/useFinance'
import { useBills } from '../hooks/useBills'
import MoneyNav from '../components/MoneyNav'
import { todayInZone, shortDate } from '../utils/dates'
import {
  monthStartFor,
  nextMonthStart,
  prevMonthStart,
  monthEndFor,
  rangeLabel,
} from '../utils/financeMonth'
import { money, round2 } from '../utils/money'
import { daysUntil } from '../utils/bills'
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/financeService'
import { inputCls, btnCls, btnOutlineCls } from '../styles'

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
  const bills = useBills(user.uid)

  const formRef = useRef(null)
  const [editingId, setEditingId] = useState(null)

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

  const dueSoon = bills.filter((b) => daysUntil(b.nextDue, today) <= 3).length

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

  function resetForm() {
    setEditingId(null)
    setAmount('')
    setNote('')
    setDate(today)
    setCategoryId('')
  }

  function startEdit(t) {
    setError('')
    setMsg('')
    setEditingId(t.id)
    setType(t.type)
    setAmount(String(t.amount))
    setCategoryId(t.categoryId)
    setDate(t.date)
    setNote(t.note || '')
    // bring the form into view
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function cancelEdit() {
    resetForm()
    setError('')
    setMsg('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMsg('')

    const value = Number(amount)
    if (!amount || !Number.isFinite(value) || value <= 0) {
      return setError('Enter an amount more than 0.')
    }
    if (!chosen) return setError('Pick a category.')
    if (!date) return setError('Pick a date.')

    const data = {
      type,
      amount: round2(value),
      categoryId: chosen.id,
      categoryName: chosen.name,
      date,
      note,
    }

    setBusy(true)
    try {
      if (editingId) {
        await updateTransaction(user.uid, editingId, data)
        resetForm()
        setMsg('Changes saved ✓')
      } else {
        await addTransaction(user.uid, data)
        setAmount('')
        setNote('')
        const inView = date >= viewStart && date <= viewEnd
        setMsg(inView ? 'Added ✓' : 'Added ✓ (it belongs to a different month)')
      }
    } catch (err) {
      console.error(err)
      setError('Could not save. Please try again.')
    }
    setBusy(false)
  }

  async function handleDelete(t) {
    if (window.confirm(`Delete this ${money(t.amount)} entry?`)) {
      await deleteTransaction(user.uid, t.id)
      if (editingId === t.id) resetForm()
    }
  }

  const maxCat = byCategory[0]?.total || 1

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto">
      <Link to="/" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to today
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Money 💰
      </h1>

      <MoneyNav />

      {dueSoon > 0 && (
        <Link
          to="/money/bills"
          className="mt-3 block rounded-2xl bg-blush px-4 py-3 text-sm font-bold text-charcoal"
        >
          🧾 {dueSoon} bill{dueSoon === 1 ? ' is' : 's are'} due soon or overdue. Tap to see.
        </Link>
      )}

      {/* month switcher */}
      <div className="mt-4 flex items-center justify-between">
        <button
          aria-label="Previous month"
          onClick={() => setViewStart(prevMonthStart(viewStart))}
          className="h-11 w-11 shrink-0 rounded-full bg-softblush dark:bg-dark-card text-xl font-bold"
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
          className="h-11 w-11 shrink-0 rounded-full bg-softblush dark:bg-dark-card text-xl font-bold disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {/* totals: stacked rows on phones, three boxes on bigger screens */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between gap-3 rounded-3xl bg-softblush px-5 py-3 shadow-sm dark:bg-dark-card sm:block sm:p-4 sm:text-center">
          <p className="text-sm opacity-70 sm:text-xs">Income</p>
          <p className="font-extrabold text-deepsage dark:text-sage sm:mt-1">
            {money(totals.income)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-3xl bg-softblush px-5 py-3 shadow-sm dark:bg-dark-card sm:block sm:p-4 sm:text-center">
          <p className="text-sm opacity-70 sm:text-xs">Spent</p>
          <p className="font-extrabold sm:mt-1">{money(totals.spent)}</p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-3xl bg-softblush px-5 py-3 shadow-sm dark:bg-dark-card sm:block sm:p-4 sm:text-center">
          <p className="text-sm opacity-70 sm:text-xs">Balance</p>
          <p
            className={`font-extrabold sm:mt-1 ${
              totals.balance < 0 ? 'text-red-600' : 'text-deepsage dark:text-sage'
            }`}
          >
            {money(totals.balance)}
          </p>
        </div>
      </div>

      {/* add / edit form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-5 sm:p-6 space-y-3 ${
          editingId ? 'ring-2 ring-blush' : ''
        }`}
      >
        <h2 className="font-bold">{editingId ? 'Edit this entry ✏️' : 'Add an entry'}</h2>

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
          {busy ? 'Saving...' : editingId ? 'Save changes' : 'Add entry'}
        </button>
        {editingId && (
          <button
            type="button"
            className={btnOutlineCls}
            onClick={cancelEdit}
            disabled={busy}
          >
            Cancel
          </button>
        )}
      </form>

      {/* where the money went */}
      {byCategory.length > 0 && (
        <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-5 sm:p-6">
          <h2 className="font-bold">Where your money went</h2>
          <div className="mt-3 space-y-3">
            {byCategory.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-semibold">{c.name}</span>
                  <span className="shrink-0">{money(c.total)}</span>
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
              className={`flex items-center gap-2 rounded-2xl bg-softblush dark:bg-dark-card px-4 py-3 ${
                editingId === t.id ? 'ring-2 ring-blush' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{nameOf(t)}</p>
                <p className="text-xs opacity-70 truncate">
                  {shortDate(t.date)}
                  {t.note ? ` · ${t.note}` : ''}
                </p>
              </div>
              <p
                className={`shrink-0 whitespace-nowrap text-sm font-bold sm:text-base ${
                  income ? 'text-deepsage dark:text-sage' : ''
                }`}
              >
                {income ? '+' : '−'}
                {money(t.amount)}
              </p>
              <button
                onClick={() => startEdit(t)}
                aria-label="Edit entry"
                className="shrink-0 px-1.5 text-sm font-bold text-deepsage dark:text-sage"
              >
                ✎
              </button>
              <button
                onClick={() => handleDelete(t)}
                aria-label="Delete entry"
                className="shrink-0 px-1 text-sm font-bold text-red-600"
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