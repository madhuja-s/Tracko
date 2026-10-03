import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { DAY_LABELS } from '../utils/dates'
import { GOALS } from '../data/starterRoutines'
import { addTask, updateTask, deleteTask } from '../services/routineService'
import { addGoalArea } from '../services/goalAreaService'
import { inputCls, btnCls } from '../styles'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

function DayPicker({ value, onChange }) {
  function toggle(d) {
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort())
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {DAY_LABELS.map((label, d) => {
        const on = value.includes(d)
        return (
          <button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            className={`rounded-full px-3 py-1 text-xs font-bold border-2 transition ${
              on ? 'bg-sage border-sage text-charcoal' : 'border-sage/50'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function ManageRoutine() {
  const { user, profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [newName, setNewName] = useState('')
  const [newDays, setNewDays] = useState(ALL_DAYS)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDays, setEditDays] = useState(ALL_DAYS)
  const [error, setError] = useState('')

  // add-a-goal-area state
  const [pickedGoal, setPickedGoal] = useState(null)
  const [picked, setPicked] = useState([])
  const [goalMsg, setGoalMsg] = useState('')
  const [goalBusy, setGoalBusy] = useState(false)

  const myGoals = profile?.goals || []
  const existingNames = new Set(tasks.map((t) => t.name.trim().toLowerCase()))
  const pickedGoalObj = GOALS.find((g) => g.id === pickedGoal)

  useEffect(() => {
    return onSnapshot(collection(db, 'users', user.uid, 'routines'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setTasks(list)
    })
  }, [user.uid])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    if (!newName.trim()) return setError('Type a task name first.')
    if (newDays.length === 0) return setError('Pick at least one day.')
    await addTask(user.uid, newName, newDays)
    setNewName('')
    setNewDays(ALL_DAYS)
  }

  function startEdit(t) {
    setError('')
    setEditingId(t.id)
    setEditName(t.name)
    setEditDays(t.weekdays || ALL_DAYS)
  }

  async function saveEdit() {
    setError('')
    if (!editName.trim()) return setError('Task name cannot be empty.')
    if (editDays.length === 0) return setError('Pick at least one day.')
    await updateTask(user.uid, editingId, { name: editName, weekdays: editDays })
    setEditingId(null)
  }

  async function handleDelete(t) {
    if (window.confirm(`Delete "${t.name}"? Your past history stays saved.`)) {
      await deleteTask(user.uid, t.id)
    }
  }

  function openGoal(g) {
    setGoalMsg('')
    setPickedGoal(g.id)
    setPicked(g.tasks.filter((n) => !existingNames.has(n.toLowerCase())))
  }

  function togglePicked(name) {
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]))
  }

  async function confirmAddGoal() {
    setGoalMsg('')
    if (picked.length === 0) return setGoalMsg('Tick at least one task to add.')
    setGoalBusy(true)
    try {
      await addGoalArea(user.uid, pickedGoal, picked)
      setGoalMsg(`${pickedGoalObj.label} added to your routine ✓`)
      setPickedGoal(null)
      setPicked([])
    } catch (err) {
      console.error(err)
      setGoalMsg('Could not add. Please try again.')
    }
    setGoalBusy(false)
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto">
      <Link to="/" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to today
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Edit routine ✏️
      </h1>

      <form
        onSubmit={handleAdd}
        className="mt-5 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-3"
      >
        <h2 className="font-bold">Add a task</h2>
        <input
          className={inputCls}
          placeholder="e.g. Read 10 pages"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <p className="text-sm opacity-70">Which days?</p>
        <DayPicker value={newDays} onChange={setNewDays} />
        {error && !editingId && <p className="text-sm text-red-600">{error}</p>}
        <button className={btnCls}>Add task</button>
      </form>

      {/* ADD A GOAL AREA */}
      <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
        <h2 className="font-bold">Add a goal area 🌱</h2>
        <p className="text-sm opacity-70">
          Want to work on something new? Pick an area and add its starter tasks.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const has = myGoals.includes(g.id)
            const active = pickedGoal === g.id
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => openGoal(g)}
                className={`rounded-full px-4 py-2 text-sm font-semibold border-2 transition ${
                  active
                    ? 'bg-blush border-blush text-charcoal'
                    : has
                      ? 'border-sage bg-sage/20'
                      : 'border-sage/60'
                }`}
              >
                {g.label}
                {has ? ' ✓' : ''}
              </button>
            )
          })}
        </div>

        {pickedGoalObj && (
          <div className="mt-4 space-y-2">
            {pickedGoalObj.tasks.map((name) => {
              const exists = existingNames.has(name.toLowerCase())
              return (
                <label
                  key={name}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                    exists
                      ? 'opacity-50 bg-white/40 dark:bg-dark-bg'
                      : 'bg-white/60 dark:bg-dark-bg cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={exists}
                    checked={!exists && picked.includes(name)}
                    onChange={() => togglePicked(name)}
                    className="h-5 w-5 accent-[#5E7F5E]"
                  />
                  <span className="flex-1">{name}</span>
                  {exists && <span className="text-xs">already added</span>}
                </label>
              )
            })}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={confirmAddGoal}
                disabled={goalBusy}
                className="flex-1 rounded-full bg-blush text-charcoal font-bold py-2 disabled:opacity-60"
              >
                {goalBusy ? 'Adding...' : 'Add to my routine'}
              </button>
              <button
                type="button"
                onClick={() => setPickedGoal(null)}
                className="flex-1 rounded-full border-2 border-sage font-bold py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {goalMsg && (
          <p className="mt-3 text-sm font-semibold text-deepsage dark:text-sage">
            {goalMsg}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-5"
          >
            {editingId === t.id ? (
              <div className="space-y-3">
                <input
                  className={inputCls}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <DayPicker value={editDays} onChange={setEditDays} />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex-1 rounded-full bg-blush text-charcoal font-bold py-2"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 rounded-full border-2 border-sage font-bold py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs opacity-70 mt-1">
                  {t.weekdays?.length === 7
                    ? 'Every day'
                    : t.weekdays?.map((d) => DAY_LABELS[d]).join(', ')}
                </p>
                <div className="mt-3 flex gap-4 text-sm font-bold">
                  <button
                    onClick={() => startEdit(t)}
                    className="text-deepsage dark:text-sage"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(t)} className="text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm opacity-70">No tasks yet. Add your first one above.</p>
        )}
      </div>
    </div>
  )
}