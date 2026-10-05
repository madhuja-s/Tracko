import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSavingsGoal, useSavingsEntries } from '../hooks/useSavings'
import {
  addSavingsEntry,
  deleteSavingsEntry,
  deleteSavingsGoal,
} from '../services/savingsService'
import { todayInZone, shortDate } from '../utils/dates'
import { money, round2 } from '../utils/money'
import { SavingsJar, PiggyBank } from '../components/Doodles'
import { inputCls, btnCls } from '../styles'

const hand = { fontFamily: "'Caveat', cursive" }

function cheer(pct) {
  if (pct >= 100) return 'Goal reached! Treat yourself 🎉'
  if (pct >= 75) return 'So close, keep going!'
  if (pct >= 50) return "Over halfway there!"
  if (pct >= 25) return "You're doing great!"
  if (pct > 0) return 'Every rupee counts ♡'
  return 'Your first step starts here 🌱'
}

function fullDate(d) {
  return `${shortDate(d)} ${d.slice(0, 4)}`
}

export default function SavingsGoal() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const today = todayInZone(profile?.timeZone)

  const { goal, status } = useSavingsGoal(user.uid, id)
  const entries = useSavingsEntries(user.uid, id)

  const [date, setDate] = useState(today)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    let run = 0
    return entries.map((e) => {
      run = round2(run + e.amount)
      return { ...e, total: run }
    })
  }, [entries])

  const saved = rows.length ? rows[rows.length - 1].total : 0

  if (status === 'loading') {
    return <p className="p-6 font-semibold text-deepsage">Loading... 🌸</p>
  }

  if (status === 'missing' || !goal) {
    return (
      <div className="min-h-screen p-6 max-w-xl mx-auto">
        <p className="font-semibold">This goal could not be found.</p>
        <Link to="/money/savings" className="mt-3 inline-block font-bold text-deepsage">
          ← Back to savings goals
        </Link>
      </div>
    )
  }

  const pct = goal.target > 0 ? Math.round((saved / goal.target) * 100) : 0
  const shownPct = Math.min(100, pct)
  const left = round2(Math.max(0, goal.target - saved))

  async function handleAdd(e) {
    e.preventDefault()
    setError('')

    const value = Number(amount)
    if (!amount || !Number.isFinite(value) || value <= 0) {
      return setError('Enter an amount more than 0.')
    }
    if (!date) return setError('Pick a date.')

    setBusy(true)
    try {
      await addSavingsEntry(user.uid, id, { date, amount: round2(value), note })
      setAmount('')
      setNote('')
    } catch (err) {
      console.error(err)
      setError('Could not save. Please try again.')
    }
    setBusy(false)
  }

  async function handleDeleteEntry(entry) {
    if (window.confirm(`Delete the ${money(entry.amount)} entry?`)) {
      await deleteSavingsEntry(user.uid, id, entry)
    }
  }

  async function handleDeleteGoal() {
    if (window.confirm(`Delete "${goal.name}" and its whole savings log?`)) {
      await deleteSavingsGoal(user.uid, id)
      navigate('/money/savings')
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <Link
        to="/money/savings"
        className="text-sm font-bold text-deepsage dark:text-sage"
      >
        ← All savings goals
      </Link>

      {/* title and sticky note */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1
            className="inline-block rounded-2xl bg-blush px-4 py-1 text-4xl font-bold leading-tight text-charcoal"
            style={hand}
          >
            Savings Tracker
          </h1>
          <p className="mt-2 text-xs font-bold tracking-widest opacity-70">
            SMALL STEPS ♡ BIG DREAMS
          </p>
        </div>
        <div className="relative w-28 shrink-0 rotate-3 rounded-lg bg-softblush dark:bg-dark-card border border-blush p-3 pt-4 shadow-sm">
          <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-sm bg-blush/80" />
          <p className="text-lg leading-tight" style={hand}>
            Save today for the life you want tomorrow ♡
          </p>
        </div>
      </div>

      {/* goal, start, end */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-softblush dark:bg-dark-card p-3">
          <p className="text-sm font-bold">🎯 Goal</p>
          <p className="mt-2 rounded-xl bg-white/70 dark:bg-dark-bg px-2 py-2 text-sm font-semibold break-words">
            {goal.name}
          </p>
        </div>
        <div className="rounded-2xl bg-blush/40 dark:bg-dark-card p-3">
          <p className="text-sm font-bold">📅 Start</p>
          <p className="mt-2 rounded-xl bg-white/70 dark:bg-dark-bg px-2 py-2 text-sm font-semibold">
            {fullDate(goal.startDate)}
          </p>
        </div>
        <div className="rounded-2xl bg-sage/30 dark:bg-dark-card p-3">
          <p className="text-sm font-bold">📅 End</p>
          <p className="mt-2 rounded-xl bg-white/70 dark:bg-dark-bg px-2 py-2 text-sm font-semibold">
            {goal.endDate ? fullDate(goal.endDate) : 'Anytime'}
          </p>
        </div>
      </div>

      {/* jar and log */}
           <div className="mt-4 grid grid-cols-1 gap-3 min-[460px]:grid-cols-[130px_1fr]">
                <div className="mx-auto w-[150px] rounded-3xl bg-softblush/60 dark:bg-dark-card p-2 min-[460px]:w-auto">
          <SavingsJar percent={shownPct} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-blush bg-white/50 dark:bg-dark-card">
          <p
            className="bg-softblush dark:bg-dark-bg py-2 text-center text-2xl font-bold"
            style={hand}
          >
            ♡ Savings Log ♡
          </p>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="bg-blush px-1 py-1.5 font-bold text-charcoal">Date</th>
                  <th className="bg-softblush px-1 py-1.5 font-bold text-charcoal">Amount</th>
                  <th className="bg-sage/40 px-1 py-1.5 font-bold text-charcoal">Total</th>
                  <th className="w-6 bg-white/40" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-6 text-center opacity-70">
                      Nothing saved yet.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-blush/50">
                    <td className="px-1 py-1.5 text-center">{shortDate(r.date)}</td>
                    <td className="px-1 py-1.5 text-center font-semibold">
                      {money(r.amount)}
                    </td>
                    <td className="px-1 py-1.5 text-center">{money(r.total)}</td>
                    <td className="text-center">
                      <button
                        onClick={() => handleDeleteEntry(r)}
                        aria-label="Delete this entry"
                        className="px-1 font-bold text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* current savings and progress */}
      <div className="mt-4 rounded-3xl bg-blush/50 dark:bg-dark-card p-5 text-center">
        <p className="text-2xl font-bold" style={hand}>
          Current Savings
        </p>
        <p className="mt-1 rounded-full bg-white/70 dark:bg-dark-bg px-4 py-2 text-2xl font-extrabold text-deepsage dark:text-sage">
          {money(saved)}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>Progress</span>
          <span>{shownPct}%</span>
        </div>
        <div
          className="mt-1 h-4 rounded-full border border-blush bg-white/70 dark:bg-dark-bg overflow-hidden"
          role="progressbar"
          aria-valuenow={shownPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Savings progress"
        >
          <div
            className="h-full bg-sage transition-all duration-700"
            style={{ width: `${shownPct}%` }}
          />
        </div>
        <p className="mt-1 text-center text-sm font-semibold">
          {money(saved)} <span className="opacity-60">/</span> {money(goal.target)}
          {left > 0 && <span className="opacity-60"> · {money(left)} to go</span>}
        </p>
      </div>

      <p
        className="mt-4 rounded-full bg-sage/30 px-4 py-3 text-center text-2xl font-bold"
        style={hand}
      >
        {cheer(pct)}
      </p>

      {/* add savings */}
      <form
        onSubmit={handleAdd}
        className="mt-5 rounded-3xl bg-softblush dark:bg-dark-card shadow-sm p-6 space-y-3"
      >
        <h2 className="text-2xl font-bold" style={hand}>
          Add to your jar ♡
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sdate" className="text-sm font-bold">
              Date
            </label>
            <input
              id="sdate"
              type="date"
              className={`${inputCls} mt-1`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="samt" className="text-sm font-bold">
              Amount (₹)
            </label>
            <input
              id="samt"
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
        </div>

        <div>
          <label htmlFor="snote" className="text-sm font-bold">
            Note (optional)
          </label>
          <input
            id="snote"
            className={`${inputCls} mt-1`}
            placeholder="e.g. Birthday money"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={btnCls} disabled={busy}>
          {busy ? 'Saving...' : 'Add savings'}
        </button>
      </form>

      {/* footer */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <PiggyBank className="w-24 h-auto" />
        <p className="text-3xl font-bold leading-tight" style={hand}>
          Save
          <br />
          Spend
          <br />
          Grow
        </p>
      </div>

      <button
        onClick={handleDeleteGoal}
        className="mt-6 block w-full text-center text-sm font-bold text-red-600"
      >
        Delete this goal
      </button>
    </div>
  )
}