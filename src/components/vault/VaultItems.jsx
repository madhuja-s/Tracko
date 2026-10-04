import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useVault } from '../../context/VaultContext'
import { useVaultItems } from '../../hooks/useVaultItems'
import { addVaultItem, updateVaultItem, deleteVaultItem } from '../../services/vaultService'
import { inputCls, btnCls } from '../../styles'

const KINDS = [
  ['note', '📝 Note'],
  ['goal', '🎯 Goal'],
  ['idea', '💡 Idea'],
]
const kindLabel = Object.fromEntries(KINDS)

function ItemForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [kind, setKind] = useState(initial?.kind ?? 'note')
  const [body, setBody] = useState(initial?.body ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Give it a title.')
    if (body.length > 20000) return setError('That is too long. Keep it under 20,000 characters.')
    setBusy(true)
    try {
      await onSave({ title, kind, body })
    } catch (err) {
      console.error(err)
      setError('Could not save. Is your vault still unlocked?')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm font-bold" htmlFor="vtitle">
          Title
        </label>
        <input
          id="vtitle"
          className={`${inputCls} mt-1`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-bold" htmlFor="vkind">
          Type
        </label>
        <select
          id="vkind"
          className={`${inputCls} mt-1`}
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {KINDS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-bold" htmlFor="vbody">
          Write here
        </label>
        <textarea
          id="vbody"
          rows={6}
          className={`${inputCls} mt-1`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className={btnCls} disabled={busy}>
          {busy ? 'Locking and saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-full border-2 border-sage font-bold py-3"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function VaultSettings() {
  const { changePassword, idleMinutes, setIdleMinutes } = useVault()
  const [cur, setCur] = useState('')
  const [npw, setNpw] = useState('')
  const [npw2, setNpw2] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleChange(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!cur) return setError('Enter your current vault password.')
    if (npw.length < 10) return setError('Your new password needs at least 10 characters.')
    if (npw !== npw2) return setError('The two new passwords do not match.')
    setBusy(true)
    try {
      await changePassword(cur, npw)
      setMsg('Vault password changed ✓')
      setCur('')
      setNpw('')
      setNpw2('')
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  return (
    <div className="mt-6 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6 space-y-5">
      <div>
        <h2 className="font-bold">Auto-lock</h2>
        <label htmlFor="idle" className="text-sm opacity-80">
          Lock the vault after this long without activity
        </label>
        <select
          id="idle"
          className={`${inputCls} mt-2`}
          value={idleMinutes}
          onChange={(e) => setIdleMinutes(Number(e.target.value))}
        >
          {[1, 5, 15, 30].map((m) => (
            <option key={m} value={m}>
              {m} minute{m === 1 ? '' : 's'}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleChange} className="space-y-3">
        <h2 className="font-bold">Change vault password</h2>
        <input
          type="password"
          autoComplete="current-password"
          aria-label="Current vault password"
          placeholder="Current vault password"
          className={inputCls}
          value={cur}
          onChange={(e) => setCur(e.target.value)}
        />
        <input
          type="password"
          autoComplete="new-password"
          aria-label="New vault password"
          placeholder="New vault password (10+ characters)"
          className={inputCls}
          value={npw}
          onChange={(e) => setNpw(e.target.value)}
        />
        <input
          type="password"
          autoComplete="new-password"
          aria-label="New vault password again"
          placeholder="New password again"
          className={inputCls}
          value={npw2}
          onChange={(e) => setNpw2(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm font-semibold text-deepsage dark:text-sage">{msg}</p>}
        <button className={btnCls} disabled={busy}>
          {busy ? 'Changing (this takes a moment)...' : 'Change password'}
        </button>
        <p className="text-xs opacity-70">Your recovery key keeps working after you change it.</p>
      </form>
    </div>
  )
}

export default function VaultItems() {
  const { user } = useAuth()
  const { dek } = useVault()
  const { items, ready } = useVaultItems(user.uid, dek)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null) // null, "new", or an item id
  const [openId, setOpenId] = useState(null)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(
      (it) =>
        (filter === 'all' || it.kind === filter) &&
        (!q || it.title.toLowerCase().includes(q) || it.body.toLowerCase().includes(q)),
    )
  }, [items, query, filter])

  async function handleDelete(it) {
    if (window.confirm(`Delete "${it.title}"? This cannot be undone.`)) {
      await deleteVaultItem(user.uid, it.id)
      setOpenId(null)
    }
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          className={inputCls}
          aria-label="Search your vault"
          placeholder="Search your vault"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={() => setEditing('new')}
          className="shrink-0 rounded-full bg-blush px-5 font-bold text-charcoal"
        >
          + New
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[['all', 'All'], ...KINDS].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`rounded-full border-2 px-3 py-1 text-sm font-bold transition ${
              filter === id ? 'border-blush bg-blush text-charcoal' : 'border-sage/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {editing === 'new' && (
        <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
          <h2 className="mb-3 font-bold">New item</h2>
          <ItemForm
            onSave={async (fields) => {
              await addVaultItem(user.uid, dek, fields)
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {!ready && <p className="text-sm opacity-70">Opening your items...</p>}
        {ready && items.length === 0 && editing !== 'new' && (
          <p className="text-sm opacity-70">
            Your vault is empty. Tap "+ New" to add your first private note or secret goal.
          </p>
        )}
        {ready && items.length > 0 && shown.length === 0 && (
          <p className="text-sm opacity-70">Nothing matches your search.</p>
        )}

        {shown.map((it) => {
          const open = openId === it.id
          return (
            <div
              key={it.id}
              className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-5"
            >
              {editing === it.id ? (
                <ItemForm
                  initial={it}
                  onSave={async (fields) => {
                    await updateVaultItem(user.uid, dek, it.id, fields)
                    setEditing(null)
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : it.id)}
                    aria-expanded={open}
                    className="flex w-full items-start justify-between gap-3 text-left"
                  >
                    <span>
                      <span className="block font-bold">{it.title}</span>
                      <span className="text-xs opacity-70">{kindLabel[it.kind] || '📝 Note'}</span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-deepsage dark:text-sage">
                      {open ? 'Hide' : 'Open'}
                    </span>
                  </button>

                  {open && (
                    <>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                        {it.body || 'Nothing written yet.'}
                      </p>
                      {it.ok && (
                        <div className="mt-3 flex gap-4 text-sm font-bold">
                          <button
                            onClick={() => setEditing(it.id)}
                            className="text-deepsage dark:text-sage"
                          >
                            Edit
                          </button>
                          <button onClick={() => handleDelete(it)} className="text-red-600">
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <VaultSettings />
    </div>
  )
}