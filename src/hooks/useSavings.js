import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// all savings goals, newest first
export function useSavingsGoals(uid) {
  const [goals, setGoals] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'users', uid, 'savingsGoals'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort(
          (a, b) => (b.createdAt?.seconds ?? 9e12) - (a.createdAt?.seconds ?? 9e12),
        )
        setGoals(list)
        setReady(true)
      },
      (err) => console.error(err),
    )
  }, [uid])

  return { goals, ready }
}

// one goal. status is "loading", "ok" or "missing"
export function useSavingsGoal(uid, id) {
  const [state, setState] = useState({ goal: null, status: 'loading' })

  useEffect(() => {
    setState({ goal: null, status: 'loading' })
    return onSnapshot(
      doc(db, 'users', uid, 'savingsGoals', id),
      (snap) =>
        setState(
          snap.exists()
            ? { goal: { id: snap.id, ...snap.data() }, status: 'ok' }
            : { goal: null, status: 'missing' },
        ),
      (err) => {
        console.error(err)
        setState({ goal: null, status: 'missing' })
      },
    )
  }, [uid, id])

  return state
}

// the savings log for one goal, oldest first
export function useSavingsEntries(uid, id) {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    setEntries([])
    return onSnapshot(
      collection(db, 'users', uid, 'savingsGoals', id, 'entries'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            (a.createdAt?.seconds ?? 9e12) - (b.createdAt?.seconds ?? 9e12),
        )
        setEntries(list)
      },
      (err) => console.error(err),
    )
  }, [uid, id])

  return entries
}