import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useFinance'
import {
  addCategory,
  renameCategory,
  deleteCategory,
  saveMonthStart,
} from '../services/financeService'
import { inputCls, btnCls } from '../styles'

function CategorySection({ uid, type, title, list }) {
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const exists = (name, exceptId) =>
    list.some(
      (c) => c.id !== exceptId && c.name.trim().toLowerCase() === name.trim().toLowerCase(),
    )

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    if (!newName.trim()) return setError('Type a name first.')
    if (exists(newName)) return setError('You already have that category.')
    await addCategory(uid, { name: newName, type })
    setNewName('')
  }

  async function saveEdit() {
    setError('')
    if (!editName.trim()) return setError('Name cannot be empty.')
    if (exists(editName, editId)) return setError('You already have that category.')
    await renameCategory(uid, editId, editName)
    setEditId(null)
  }

  async function handleDelete(c) {
    if (window.confirm(`Delete "${c.name}"? Your past entries keep their name.`)) {
      await deleteCategory(uid, c.id)
    }
  }

  return (
    <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
      <h2 className="font-bold">{title}</h2>

      <div className="mt-3 space-y-2">
        {list.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl bg-white/60 dark:bg-dark-bg px-4 py-3"
          >
            {editId === c.id ? (
              <div className="space-y-2">
                <input
                  className={inputCls}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex-1 rounded-full bg-blush text-charcoal font-bold py-2"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="flex-1 rounded-full border-2 border-sage font-bold py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex-1 font-semibold">{c.name}</span>
                <button
                  onClick={() => {
                    setError('')
                    setEditId(c.id)
                    setEditName(c.name)
                  }}
                  className="text-sm font-bold text-deepsage dark:text-sage"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="text-sm font-bold text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-sm opacity-70">No categories yet. Add one below.</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          className={inputCls}
          placeholder="New category"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="rounded-full bg-sage text-charcoal font-bold px-5">Add</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default function FinanceSettings() {
  const { user, profile } = useAuth()
  const { categories } = useCategories(user.uid)
  const [day, setDay] = useState(profile?.financeMonthStart ?? 1)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    setBusy(true)
    try {
      await saveMonthStart(user.uid, Number(day))
      setMsg('Saved ✓')
    } catch (err) {
      console.error(err)
      setMsg('Could not save. Please try again.')
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <Link to="/money" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to money
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Categories & month
      </h1>

      <form
        onSubmit={handleSave}
        className="mt-5 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-3"
      >
        <h2 className="font-bold">Your money month starts on</h2>
        <p className="text-sm opacity-70">
          Pick the day your pocket money or salary usually arrives. Your month then runs
          from that day to the day before it next month.
        </p>
        <select
          className={inputCls}
          value={day}
          onChange={(e) => setDay(e.target.value)}
          aria-label="Day of the month"
        >
          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              Day {d}
            </option>
          ))}
        </select>
        {msg && (
          <p className="text-sm font-semibold text-deepsage dark:text-sage">{msg}</p>
        )}
        <button className={btnCls} disabled={busy}>
          {busy ? 'Saving...' : 'Save'}
        </button>
      </form>

      <CategorySection
        uid={user.uid}
        type="expense"
        title="Expense categories"
        list={categories.filter((c) => c.type === 'expense')}
      />
      <CategorySection
        uid={user.uid}
        type="income"
        title="Income categories"
        list={categories.filter((c) => c.type === 'income')}
      />
    </div>
  )
}