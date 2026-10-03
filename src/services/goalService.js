import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// period: 'week' or 'month'
// periodKey: the Monday date for a week (2026-09-28), or the month (2026-10)
export async function addGoal(uid, { title, period, periodKey }) {
  await addDoc(collection(db, 'users', uid, 'goals'), {
    title: title.trim(),
    period,
    periodKey,
    done: false,
    createdAt: serverTimestamp(),
  })
}

export async function toggleGoal(uid, goalId, done) {
  await updateDoc(doc(db, 'users', uid, 'goals', goalId), { done })
}

export async function deleteGoal(uid, goalId) {
  await deleteDoc(doc(db, 'users', uid, 'goals', goalId))
}