import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import {
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
} from 'firebase/auth'
import { auth, db, googleProvider } from '../firebase'

const SIMPLE_COLLECTIONS = [
  'routines',
  'dailyLogs',
  'goals',
  'categories',
  'transactions',
  'budgets',
  'bills',
  'vaultItems',
  'vault',
]

const LOCAL_KEYS = ['tracko-palette', 'tracko-mode', 'tracko-vault-idle']

async function deleteRefs(refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db)
    refs.slice(i, i + 400).forEach((r) => batch.delete(r))
    await batch.commit()
  }
}

// removes everything stored for this person. safe to run again if it stops halfway
async function wipeUserData(uid) {
  for (const name of SIMPLE_COLLECTIONS) {
    const snap = await getDocs(collection(db, 'users', uid, name))
    await deleteRefs(snap.docs.map((d) => d.ref))
  }

  const goals = await getDocs(collection(db, 'users', uid, 'savingsGoals'))
  for (const g of goals.docs) {
    const entries = await getDocs(collection(g.ref, 'entries'))
    await deleteRefs(entries.docs.map((d) => d.ref))
  }
  await deleteRefs(goals.docs.map((d) => d.ref))

  // the profile goes last
  await deleteRefs([doc(db, 'users', uid)])
}

function clearLocalSettings(uid) {
  try {
    LOCAL_KEYS.forEach((k) => localStorage.removeItem(k))
    localStorage.removeItem(`reminder-dismissed-${uid}`)
    localStorage.removeItem(`reminder-notified-${uid}`)
  } catch {
    // storage blocked: nothing to clear
  }
}

// asks for your password (or Google sign-in) again, as Firebase requires
async function reauthenticate(user, password) {
  const usesPassword = user.providerData.some((p) => p.providerId === 'password')
  if (usesPassword) {
    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, credential)
  } else {
    await reauthenticateWithPopup(user, googleProvider)
  }
}

export async function deleteAccount(user, password) {
  const uid = user.uid
  await reauthenticate(user, password)
  await wipeUserData(uid)
  clearLocalSettings(uid)
  await deleteUser(auth.currentUser)
}