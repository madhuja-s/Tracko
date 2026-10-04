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
import { addPeriod } from '../utils/bills'

const dayOf = (dateStr) => Number(dateStr.slice(8, 10))

export async function addBill(
  uid,
  { name, amount, categoryId, categoryName, frequency, nextDue },
) {
  await addDoc(collection(db, 'users', uid, 'bills'), {
    name: name.trim(),
    amount,
    categoryId,
    categoryName,
    frequency,
    nextDue,
    anchorDay: dayOf(nextDue),
    lastPaid: '',
    createdAt: serverTimestamp(),
  })
}

export async function updateBill(
  uid,
  id,
  { name, amount, categoryId, categoryName, frequency, nextDue },
) {
  await updateDoc(doc(db, 'users', uid, 'bills', id), {
    name: name.trim(),
    amount,
    categoryId,
    categoryName,
    frequency,
    nextDue,
    anchorDay: dayOf(nextDue),
  })
}

export async function deleteBill(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'bills', id))
}

// logs the expense on the Money page and moves the bill to its next due date
export async function markBillPaid(uid, bill, paidDate) {
  const batch = writeBatch(db)

  const txRef = doc(collection(db, 'users', uid, 'transactions'))
  batch.set(txRef, {
    type: 'expense',
    amount: bill.amount,
    categoryId: bill.categoryId,
    categoryName: bill.categoryName,
    date: paidDate,
    note: `Bill: ${bill.name}`,
    billId: bill.id,
    createdAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', uid, 'bills', bill.id), {
    nextDue: addPeriod(bill.nextDue, bill.frequency, bill.anchorDay),
    lastPaid: paidDate,
  })

  await batch.commit()
}

// moves to the next due date without logging an expense
export async function skipBill(uid, bill) {
  await updateDoc(doc(db, 'users', uid, 'bills', bill.id), {
    nextDue: addPeriod(bill.nextDue, bill.frequency, bill.anchorDay),
  })
}