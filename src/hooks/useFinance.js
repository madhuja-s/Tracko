import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { seedDefaultCategories } from '../services/financeService'

// live categories (fills in the starter categories the first time)
export function useCategories(uid) {
  const [categories, setCategories] = useState([])
  const [ready, setReady] = useState(false)
  const seeding = useRef(false)

  useEffect(() => {
    return onSnapshot(collection(db, 'users', uid, 'categories'), (snap) => {
      if (snap.empty && !snap.metadata.fromCache && !seeding.current) {
        seeding.current = true
        seedDefaultCategories(uid).catch(console.error)
      }
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setCategories(list)
      if (!snap.empty || !snap.metadata.fromCache) setReady(true)
    })
  }, [uid])

  return { categories, ready }
}

// live transactions between two dates (both included)
export function useTransactions(uid, start, end) {
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems([])
    const q = query(
      collection(db, 'users', uid, 'transactions'),
      where('date', '>=', start),
      where('date', '<=', end),
    )
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            (b.createdAt?.seconds ?? 9e12) - (a.createdAt?.seconds ?? 9e12),
        )
        setItems(list)
      },
      (err) => console.error(err),
    )
  }, [uid, start, end])

  return items
}