import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// live bills, the ones due soonest first
export function useBills(uid) {
  const [bills, setBills] = useState([])

  useEffect(() => {
    return onSnapshot(
      collection(db, 'users', uid, 'bills'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => a.nextDue.localeCompare(b.nextDue))
        setBills(list)
      },
      (err) => console.error(err),
    )
  }, [uid])

  return bills
}