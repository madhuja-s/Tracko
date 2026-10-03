import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

// id is a category id, or "overall" for the whole month's spending
export async function saveBudget(uid, id, limit) {
  await setDoc(doc(db, 'users', uid, 'budgets', id), {
    limit,
    updatedAt: serverTimestamp(),
  })
}

export async function removeBudget(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'budgets', id))
}