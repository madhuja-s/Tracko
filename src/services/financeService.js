import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const DEFAULT_CATEGORIES = [
  { id: 'd-food', name: 'Food', type: 'expense' },
  { id: 'd-travel', name: 'Travel', type: 'expense' },
  { id: 'd-study', name: 'Study', type: 'expense' },
  { id: 'd-shopping', name: 'Shopping', type: 'expense' },
  { id: 'd-bills', name: 'Bills', type: 'expense' },
  { id: 'd-health', name: 'Health', type: 'expense' },
  { id: 'd-fun', name: 'Fun', type: 'expense' },
  { id: 'd-other-expense', name: 'Other', type: 'expense' },
  { id: 'd-pocket', name: 'Pocket money', type: 'income' },
  { id: 'd-salary', name: 'Salary', type: 'income' },
  { id: 'd-gift', name: 'Gift', type: 'income' },
  { id: 'd-other-income', name: 'Other', type: 'income' },
]

// fixed ids, so running this twice can never create duplicates
export async function seedDefaultCategories(uid) {
  const batch = writeBatch(db)
  DEFAULT_CATEGORIES.forEach((c, i) => {
    batch.set(doc(db, 'users', uid, 'categories', c.id), {
      name: c.name,
      type: c.type,
      order: i,
    })
  })
  await batch.commit()
}

export async function addCategory(uid, { name, type }) {
  await addDoc(collection(db, 'users', uid, 'categories'), {
    name: name.trim(),
    type,
    order: Date.now(),
  })
}

export async function renameCategory(uid, id, name) {
  await updateDoc(doc(db, 'users', uid, 'categories', id), { name: name.trim() })
}

export async function deleteCategory(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'categories', id))
}

export async function addTransaction(
  uid,
  { type, amount, categoryId, categoryName, date, note },
) {
  await addDoc(collection(db, 'users', uid, 'transactions'), {
    type,
    amount,
    categoryId,
    categoryName,
    date,
    note: note.trim(),
    createdAt: serverTimestamp(),
  })
}

// changes an existing entry (createdAt and billId stay as they were)
export async function updateTransaction(
  uid,
  id,
  { type, amount, categoryId, categoryName, date, note },
) {
  await updateDoc(doc(db, 'users', uid, 'transactions', id), {
    type,
    amount,
    categoryId,
    categoryName,
    date,
    note: note.trim(),
  })
}

export async function deleteTransaction(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'transactions', id))
}

export async function saveMonthStart(uid, day) {
  await updateDoc(doc(db, 'users', uid), { financeMonthStart: day })
}