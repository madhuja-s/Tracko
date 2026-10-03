import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSavingsGoals } from '../hooks/useSavings'
import { addSavingsGoal } from '../services/savingsService'
import { todayInZone } from '../utils/dates'
import { money, round2 } from '../utils/money'
import { PiggyBank } from '../components/Doodles'
import { inputCls, btnCls } from '../styles'

const hand = { fontFamily: "'Caveat', cursive" }

export default function Savings() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const today = todayInZone(profile?.timeZone)
  const { goals, ready } = useSavingsGoals(user.uid)

  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError('')

    const value = Number(target)
    if (!name.trim()) return setError('Give your goal a name.')
    if (!target || !Number.isFinite(value) || value <= 0) {
      return setError('Enter a target amount more than 0.')
    }
    if (!startDate) return setError('Pick a start date.')
    if (endDate && endDate < startDate) {
      return setError('The end date must be after the start date.')
    }

    setBusy(true)
    try {
      const id = await addSavingsGoal(user.uid, {
        name,
        target: round2(value),
        startDate,
        endDate,
      })
      navigate(`/money/savings/${id}`)
    } catch (err) {
      console.error(err)
      setError('Could not save. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <Link to="/money" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to money
      </Link>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <h1
            className="text-4xl font-bold text-deepsage dark:text-sage leading-none"
            style={hand}
          >
            Savings goals
          </h1>
          <p className="mt-1 text-xs font-bold tracking-widest opacity-70">
            SMALL STEPS ♡ BIG DREAMS
          </p>
        </div>
        <PiggyBank className="w-20 h-auto" />
      </div>

      {/* goals */}
      <div className="mt-5 space-y-3">
        {ready && goals.length === 0 && (
          <p className="text-sm opacity-70">
            No goals yet. Start your first one below. A new phone? A trip? A rainy day fund?
          </p>
        )}

        {goals.map((g) => {
          const saved = round2(g.saved || 0)
          const pct = g.target > 0 ? Math.round((saved / g.target) * 100) : 0
          return (
            <Link
              key={g.id}
              to={`/money/savings/${g.id}`}
              className="block rounded-3xl bg-softblush dark:bg-dark-card shadow-sm p-5 transition hover:brightness-95"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-2xl font-bold leading-tight" style={hand}>
                  {g.name}
                </p>
                <span className="rounded-full bg-sage/30 px-3 py-1 text-xs font-bold text-deepsage dark:text-sage">
                  {Math.min(100, pct)}%
                </span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-white/70 dark:bg-dark-bg overflow-hidden">
                <div
                  className="h-full bg-sage transition-all duration-500"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <p className="mt-2 text-sm">
                {money(saved)} <span className="opacity-60">of {money(g.target)}</span>
              </p>
            </Link>
          )
        })}
      </div>

      {/* new goal */}
      <form
        onSubmit={handleCreate}
        className="mt-5 rounded-3xl bg-softblush dark:bg-dark-card shadow-sm p-6 space-y-3"
      >
        <h2 className="text-2xl font-bold" style={hand}>
          Start a new goal ♡
        </h2>

        <div>
          <label htmlFor="gname" className="text-sm font-bold">
            Goal
          </label>
          <input
            id="gname"
            className={`${inputCls} mt-1`}
            placeholder="e.g. New phone"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="gtarget" className="text-sm font-bold">
            Target amount (₹)
          </label>
          <input
            id="gtarget"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="e.g. 15000"
            className={`${inputCls} mt-1`}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="gstart" className="text-sm font-bold">
              Start date
            </label>
            <input
              id="gstart"
              type="date"
              className={`${inputCls} mt-1`}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="gend" className="text-sm font-bold">
              End date (optional)
            </label>
            <input
              id="gend"
              type="date"
              className={`${inputCls} mt-1`}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={btnCls} disabled={busy}>
          {busy ? 'Creating...' : 'Create goal'}
        </button>
      </form>
    </div>
  )
}