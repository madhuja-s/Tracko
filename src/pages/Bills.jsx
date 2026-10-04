import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBills } from '../hooks/useBills'
import { useCategories } from '../hooks/useFinance'
import { todayInZone, shortDate } from '../utils/dates'
import { money, round2 } from '../utils/money'
import { FREQ_LABEL, daysUntil, monthlyEquivalent } from '../utils/bills'
import {
  addBill,
  updateBill,
  deleteBill,
  markBillPaid,
  skipBill,
} from '../services/billService'
import { inputCls, btnCls } from '../styles'

function fullDate(d) {
  return `${shortDate(d)} ${d.slice(0, 4)}`
}

function statusOf(bill, today) {
  const d = daysUntil(bill.nextDue, today)
  if (d < 0) {
    return {
      text: `Overdue by ${-d} day${-d === 1 ? '' : 's'}`,
      cls: 'bg-red-500/15 text-red-600',
    }
  }
  if (d === 0) return { text: 'Due today', cls: 'bg-blush text-charcoal' }
  if (d === 1) return { text: 'Due tomorrow', cls: 'bg-blush text-charcoal' }
  if (d <= 7) return { text: `Due in ${d} days`, cls: 'bg-blush text-charcoal' }
  return {
    text: `Due ${fullDate(bill.nextDue)}`,
    cls: 'bg-sage/30 text-deepsage dark:text-sage',
  }
}

function BillForm({ categories, today, initial, submitLabel, onSubmit, onCancel }) {
  const expenseCats = categories.filter((c) => c.type === 'expense')

  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [frequency, setFrequency] = useState(initial?.frequency ?? 'monthly')
  const [nextDue, setNextDue] = useState(initial?.nextDue ?? today)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const chosen =
    expenseCats.find((c) => c.id === categoryId) ||
    expenseCats.find((c) => c.id === 'd-bills') ||
    expenseCats[0]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const value = Number(amount)
    if (!name.trim()) return setError('Give the bill a name.')
    if (!amount || !Number.isFinite(value) || value <= 0) {
      return setError('Enter an amount more than 0.')
    }
    if (!chosen) return setError('Pick a category.')
    if (!nextDue) return setError('Pick the next due date.')

    setBusy(true)
    try {
      await onSubmit({
        name,
        amount: round2(value),
        categoryId: chosen.id,
        categoryName: chosen.name,
        frequency,
        nextDue,
      })
      if (!initial) {
        setName('')
        setAmount('')
      }
    } catch (err) {
      console.error(err)
      setError('Could not save. Please try again.')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm font-bold" htmlFor={`bn-${initial?.id || 'new'}`}>
          Bill name
        </label>
        <input
          id={`bn-${initial?.id || 'new'}`}
          className={`${inputCls} mt-1`}
          placeholder="e.g. Rent, Netflix, Phone recharge"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-bold" htmlFor={`ba-${initial?.id || 'new'}`}>
            Amount (₹)
          </label>
          <input
            id={`ba-${initial?.id || 'new'}`}
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
          <label className="text-sm font-bold" htmlFor={`bf-${initial?.id || 'new'}`}>
            Repeats
          </label>
          <select
            id={`bf-${initial?.id || 'new'}`}
            className={`${inputCls} mt-1`}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="monthly">Every month</option>
            <option value="weekly">Every week</option>
            <option value="yearly">Every year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-bold" htmlFor={`bc-${initial?.id || 'new'}`}>
            Category
          </label>
          <select
            id={`bc-${initial?.id || 'new'}`}
            className={`${inputCls} mt-1`}
            value={chosen?.id || ''}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {expenseCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-bold" htmlFor={`bd-${initial?.id || 'new'}`}>
            Next due date
          </label>
          <input
            id={`bd-${initial?.id || 'new'}`}
            type="date"
            className={`${inputCls} mt-1`}
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button className={btnCls} disabled={busy}>
          {busy ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-full border-2 border-sage font-bold py-3"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default function Bills() {
  const { user, profile } = useAuth()
  const today = todayInZone(profile?.timeZone)
  const bills = useBills(user.uid)
  const { categories } = useCategories(user.uid)

  const [editingId, setEditingId] = useState(null)
  const [msg, setMsg] = useState('')

  const summary = useMemo(() => {
    const soon = bills.filter((b) => daysUntil(b.nextDue, today) <= 7)
    return {
      soonCount: soon.length,
      soonTotal: round2(soon.reduce((sum, b) => sum + b.amount, 0)),
      perMonth: round2(
        bills.reduce((sum, b) => sum + monthlyEquivalent(b.amount, b.frequency), 0),
      ),
    }
  }, [bills, today])

  async function handlePaid(bill) {
    setMsg('')
    try {
      await markBillPaid(user.uid, bill, today)
      setMsg(`${bill.name} marked as paid. ${money(bill.amount)} added to your Money page ✓`)
    } catch (err) {
      console.error(err)
      setMsg('Could not mark it as paid. Please try again.')
    }
  }

  async function handleSkip(bill) {
    setMsg('')
    if (window.confirm(`Skip this ${bill.name} payment? Nothing is added to your Money page.`)) {
      await skipBill(user.uid, bill)
    }
  }

  async function handleDelete(bill) {
    if (window.confirm(`Delete the bill "${bill.name}"? Past entries on your Money page stay.`)) {
      await deleteBill(user.uid, bill.id)
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <Link to="/money" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to money
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Bills 🧾
      </h1>

      {/* summary */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-xs opacity-70">Due in 7 days</p>
          <p className="mt-1 font-extrabold text-deepsage dark:text-sage">
            {money(summary.soonTotal)}
          </p>
          <p className="text-xs opacity-70">
            {summary.soonCount} bill{summary.soonCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-xs opacity-70">Bills cost about</p>
          <p className="mt-1 font-extrabold">{money(summary.perMonth)}</p>
          <p className="text-xs opacity-70">per month</p>
        </div>
      </div>

      {msg && (
        <p className="mt-3 rounded-2xl bg-sage/30 px-4 py-3 text-sm font-semibold text-deepsage dark:text-sage">
          {msg}
        </p>
      )}

      {/* list */}
      <div className="mt-4 space-y-3">
        {bills.length === 0 && (
          <p className="text-sm opacity-70">
            No bills yet. Add your first one below, like rent or a subscription.
          </p>
        )}

        {bills.map((b) => {
          const st = statusOf(b, today)
          return (
            <div
              key={b.id}
              className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-5"
            >
              {editingId === b.id ? (
                <BillForm
                  categories={categories}
                  today={today}
                  initial={b}
                  submitLabel="Save changes"
                  onSubmit={async (fields) => {
                    await updateBill(user.uid, b.id, fields)
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{b.name}</p>
                      <p className="text-xs opacity-70">
                        {FREQ_LABEL[b.frequency]} · {b.categoryName}
                      </p>
                    </div>
                    <p className="font-extrabold">{money(b.amount)}</p>
                  </div>

                  <span
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}
                  >
                    {st.text}
                  </span>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
                    <button
                      onClick={() => handlePaid(b)}
                      className="rounded-full bg-blush px-4 py-1.5 text-charcoal"
                    >
                      Mark paid
                    </button>
                    <button
                      onClick={() => handleSkip(b)}
                      className="py-1.5 text-deepsage dark:text-sage"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => setEditingId(b.id)}
                      className="py-1.5 text-deepsage dark:text-sage"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(b)} className="py-1.5 text-red-600">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* add */}
      <div className="mt-5 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
        <h2 className="font-bold mb-3">Add a bill</h2>
        <BillForm
          categories={categories}
          today={today}
          submitLabel="Add bill"
          onSubmit={(fields) => addBill(user.uid, fields)}
        />
      </div>
    </div>
  )
}
