import {
  arrayUnion,
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6] // 0 = Sunday

// adds the chosen starter tasks and remembers the goal on the user's profile
export async function addGoalArea(uid, goalId, taskNames) {
  const batch = writeBatch(db)
  const base = Date.now()

  taskNames.forEach((name, i) => {
    const ref = doc(collection(db, 'users', uid, 'routines'))
    batch.set(ref, {
      name,
      weekdays: ALL_DAYS,
      active: true,
      order: base + i,
      createdAt: serverTimestamp(),
    })
  })

  batch.update(doc(db, 'users', uid), { goals: arrayUnion(goalId) })

  await batch.commit()
}