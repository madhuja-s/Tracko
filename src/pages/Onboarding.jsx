import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GOALS, tasksForGoals } from '../data/starterRoutines'
import { saveOnboarding } from '../services/routineService'
import AuthLayout from '../components/AuthLayout'
import { inputCls, btnCls, btnOutlineCls } from '../styles'

export default function Onboarding() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState(1)
  const [goals, setGoals] = useState([])
  const [goalText, setGoalText] = useState('')
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (profile?.onboardingDone) return <Navigate to="/" replace />

  function toggleGoal(id) {
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))
  }

  function goNext() {
    setError('')
    if (goals.length === 0 && !goalText.trim()) {
      return setError('Pick at least one goal or write your own.')
    }
    setTasks(tasksForGoals(goals).map((name) => ({ name, on: true })))
    setStage(2)
  }

  function toggleTask(i) {
    setTasks((t) => t.map((x, idx) => (idx === i ? { ...x, on: !x.on } : x)))
  }

  function addTask() {
    const name = newTask.trim()
    if (!name) return
    if (tasks.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      return setError('That task is already in the list.')
    }
    setError('')
    setTasks((t) => [...t, { name, on: true }])
    setNewTask('')
  }

  async function finish() {
    setError('')
    const chosen = tasks.filter((t) => t.on).map((t) => t.name)
    if (chosen.length === 0) return setError('Keep at least one task.')

    setBusy(true)
    try {
      await saveOnboarding(user.uid, { goals, goalText, tasks: chosen })
      navigate('/')
    } catch (err) {
      console.error(err)
      setError('Could not save. Please try again.')
      setBusy(false)
    }
  }

  if (stage === 1) {
    return (
      <AuthLayout
        title="What do you want? 🌱"
        subtitle="Pick one or more goals. You can change them later."
      >
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const on = goals.includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGoal(g.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold border-2 transition ${
                  on ? 'bg-blush border-blush text-charcoal' : 'border-sage/60'
                }`}
              >
                {g.label}
              </button>
            )
          })}
        </div>

        <textarea
          className={`${inputCls} mt-4`}
          rows={3}
          placeholder="Or write it in your own words..."
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button className={`${btnCls} mt-5`} onClick={goNext}>
          Next
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Your starter routine ✨"
      subtitle="Untick what you don't want, or add your own tasks."
    >
      <div className="space-y-2">
        {tasks.length === 0 && (
          <p className="text-sm opacity-70">
            No suggestions for your own goal yet. Add your first task below.
          </p>
        )}
        {tasks.map((t, i) => (
          <label
            key={t.name}
            className="flex items-center gap-3 rounded-2xl bg-white/60 dark:bg-dark-bg px-4 py-3 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={t.on}
              onChange={() => toggleTask(i)}
              className="h-5 w-5 accent-[#5E7F5E]"
            />
            <span>{t.name}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className={inputCls}
          placeholder="Add your own task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
        />
        <button
          type="button"
          onClick={addTask}
          className="rounded-full bg-sage text-charcoal font-bold px-5"
        >
          Add
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 space-y-3">
        <button className={btnCls} onClick={finish} disabled={busy}>
          {busy ? 'Saving...' : 'Finish'}
        </button>
        <button className={btnOutlineCls} onClick={() => setStage(1)} disabled={busy}>
          Back
        </button>
      </div>
    </AuthLayout>
  )
}