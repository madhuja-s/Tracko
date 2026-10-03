import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useRoutineData } from '../hooks/useRoutineData'
import { todayInZone, startOfWeek, addDays, shortDate, monthLabel } from '../utils/dates'
import { rangeSummary } from '../utils/stats'
import { addGoal, toggleGoal, deleteGoal } from '../services/goalService'
import { inputCls } from '../styles'

function SummaryCard({ title, subtitle, s }) {
  return (
    <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-5">
      <h2 className="font-bold">{title}</h2>
      <p className="text-xs opacity-70">{subtitle}</p>
      <p className="mt-3 text-3xl font-extrabold text-deepsage dark:text-sage">
        {s.avg}%
      </p>
      <p className="text-xs opacity-70">average completion</p>
      <div className="mt-2 h-2 rounded-full bg-white/70 dark:bg-dark-bg overflow-hidden">
        <div className="h-full bg-sage" style={{ width: `${s.avg}%` }} />
      </div>
      <p className="mt-3 text-sm">
        {s.full} of {s.days} days fully done
      </p>
      <p className="text-sm">
        {s.doneTasks} of {s.totalTasks} tasks ticked
      </p>
    </div>
  )
}

function GoalSection({ uid, title, subtitle, period, periodKey, goals }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const mine = goals
    .filter((g) => g.period === period && g.periodKey === periodKey)
    .sort(
      (a, b) =>
        (a.createdAt?.seconds ?? 9e12) - (b.createdAt?.seconds ?? 9e12),
    )
  const doneCount = mine.filter((g) => g.done).length

  async function handleAdd(e) {
    e.preventDefault()
    if (!text.trim()) return setError('Type your goal first.')
    setError('')
    await addGoal(uid, { title: text, period, periodKey })
    setText('')
  }

  async function handleDelete(g) {
    if (window.confirm(`Delete the goal "${g.title}"?`)) {
      await deleteGoal(uid, g.id)
    }
  }

  return (
    <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="text-xs opacity-70">{subtitle}</p>
        </div>
        {mine.length > 0 && (
          <span className="text-sm font-semibold text-deepsage dark:text-sage">
            {doneCount}/{mine.length} done
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {mine.length === 0 && (
          <p className="text-sm opacity-70">No goals yet. Add one below.</p>
        )}
        {mine.map((g) => (
          <div
            key={g.id}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
              g.done ? 'bg-blush/60' : 'bg-white/60 dark:bg-dark-bg'
            }`}
          >
            <input
              type="checkbox"
              checked={g.done}
              onChange={() => toggleGoal(uid, g.id, !g.done)}
              className="h-5 w-5 accent-[#5E7F5E]"
            />
            <span className={`flex-1 ${g.done ? 'line-through opacity-60' : ''}`}>
              {g.title}
            </span>
            <button
              onClick={() => handleDelete(g)}
              className="text-xs font-bold text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          className={inputCls}
          placeholder="Add a goal"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="rounded-full bg-sage text-charcoal font-bold px-5">
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default function Goals() {
  const { user, profile } = useAuth()
  const tz = profile?.timeZone
  const { tasks, logs } = useRoutineData(user.uid)
  const [goals, setGoals] = useState([])

  const today = todayInZone(tz)
  const weekStart = startOfWeek(today)
  const weekEnd = addDays(weekStart, 6)
  const monthStart = today.slice(0, 8) + '01'
  const monthKey = today.slice(0, 7)

  useEffect(() => {
    return onSnapshot(collection(db, 'users', user.uid, 'goals'), (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [user.uid])

  const weekSummary = rangeSummary(tasks, logs, weekStart, today)
  const monthSummary = rangeSummary(tasks, logs, monthStart, today)
  const weekLabel = `${shortDate(weekStart)} to ${shortDate(weekEnd)}`

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto">
      <Link to="/" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to today
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Goals & progress 🎯
      </h1>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SummaryCard title="This week" subtitle={weekLabel} s={weekSummary} />
        <SummaryCard
          title="This month"
          subtitle={monthLabel(today)}
          s={monthSummary}
        />
      </div>

      <div className="mt-5 space-y-4">
        <GoalSection
          uid={user.uid}
          title="Weekly goals"
          subtitle={weekLabel}
          period="week"
          periodKey={weekStart}
          goals={goals}
        />
        <GoalSection
          uid={user.uid}
          title="Monthly goals"
          subtitle={monthLabel(today)}
          period="month"
          periodKey={monthKey}
          goals={goals}
        />
      </div>
    </div>
  )
}