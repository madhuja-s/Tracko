import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6] // 0 = Sunday

export async function saveOnboarding(uid, { goals, goalText, tasks }) {
  const batch = writeBatch(db)

  tasks.forEach((name, i) => {
    const ref = doc(collection(db, 'users', uid, 'routines'))
    batch.set(ref, {
      name,
      weekdays: ALL_DAYS,
      active: true,
      order: i,
      createdAt: serverTimestamp(),
    })
  })

  batch.update(doc(db, 'users', uid), {
    goals,
    goalText: goalText.trim(),
    onboardingDone: true,
  })

  await batch.commit()
}

export async function addTask(uid, name, weekdays) {
  await addDoc(collection(db, 'users', uid, 'routines'), {
    name: name.trim(),
    weekdays,
    active: true,
    order: Date.now(),
    createdAt: serverTimestamp(),
  })
}

export async function updateTask(uid, taskId, { name, weekdays }) {
  await updateDoc(doc(db, 'users', uid, 'routines', taskId), {
    name: name.trim(),
    weekdays,
  })
}

export async function deleteTask(uid, taskId) {
  await deleteDoc(doc(db, 'users', uid, 'routines', taskId))
}

// one log document per date, so every new day starts fresh
// and old days stay saved for streaks and graphs
export async function setDayLog(uid, date, doneIds, total) {
  await setDoc(
    doc(db, 'users', uid, 'dailyLogs', date),
    {
      date,
      doneIds,
      doneCount: doneIds.length,
      total,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}