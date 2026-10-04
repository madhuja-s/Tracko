import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { encryptJson } from '../utils/vaultCrypto'

// only scrambled text goes to the database
export async function addVaultItem(uid, key, { title, body, kind }) {
  const payload = await encryptJson(key, { title: title.trim(), body, kind }, uid)
  await addDoc(collection(db, 'users', uid, 'vaultItems'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateVaultItem(uid, key, id, { title, body, kind }) {
  const payload = await encryptJson(key, { title: title.trim(), body, kind }, uid)
  await updateDoc(doc(db, 'users', uid, 'vaultItems', id), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteVaultItem(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'vaultItems', id))
}