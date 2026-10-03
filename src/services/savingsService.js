import {
  collection,
  doc,
  addDoc,
  getDocs,
  writeBatch,
  increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export async function addSavingsGoal(uid, { name, target, startDate, endDate }) {
  const ref = await addDoc(collection(db, 'users', uid, 'savingsGoals'), {
    name: name.trim(),
    target,
    startDate,
    endDate: endDate || '',
    saved: 0,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteSavingsGoal(uid, goalId) {
  const entries = await getDocs(
    collection(db, 'users', uid, 'savingsGoals', goalId, 'entries'),
  )
  const refs = entries.docs.map((d) => d.ref)

  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db)
    refs.slice(i, i + 400).forEach((r) => batch.delete(r))
    await batch.commit()
  }

  const last = writeBatch(db)
  last.delete(doc(db, 'users', uid, 'savingsGoals', goalId))
  await last.commit()
}

export async function addSavingsEntry(uid, goalId, { date, amount, note }) {
  const batch = writeBatch(db)
  const entryRef = doc(collection(db, 'users', uid, 'savingsGoals', goalId, 'entries'))
  batch.set(entryRef, {
    date,
    amount,
    note: note.trim(),
    createdAt: serverTimestamp(),
  })
  batch.update(doc(db, 'users', uid, 'savingsGoals', goalId), {
    saved: increment(amount),
  })
  await batch.commit()
}

export async function deleteSavingsEntry(uid, goalId, entry) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'users', uid, 'savingsGoals', goalId, 'entries', entry.id))
  batch.update(doc(db, 'users', uid, 'savingsGoals', goalId), {
    saved: increment(-entry.amount),
  })
  await batch.commit()
}