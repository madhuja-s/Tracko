import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// live budgets as a map: categoryId (or "overall") -> limit in rupees
export function useBudgets(uid) {
  const [budgets, setBudgets] = useState({})

  useEffect(() => {
    return onSnapshot(collection(db, 'users', uid, 'budgets'), (snap) => {
      const map = {}
      snap.docs.forEach((d) => {
        map[d.id] = d.data().limit
      })
      setBudgets(map)
    })
  }, [uid])

  return budgets
}