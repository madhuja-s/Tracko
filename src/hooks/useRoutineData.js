import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// live routine tasks + all daily logs (as a map: date -> log)
export function useRoutineData(uid) {
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsubTasks = onSnapshot(
      collection(db, 'users', uid, 'routines'),
      (snap) => setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    )
    const unsubLogs = onSnapshot(
      collection(db, 'users', uid, 'dailyLogs'),
      (snap) => {
        const map = {}
        snap.docs.forEach((d) => {
          map[d.id] = d.data()
        })
        setLogs(map)
        setReady(true)
      },
    )
    return () => {
      unsubTasks()
      unsubLogs()
    }
  }, [uid])

  return { tasks, logs, ready }
}