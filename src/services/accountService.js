import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import {
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
} from 'firebase/auth'
import { auth, db, googleProvider } from '../firebase'

// collections that can be listed and deleted (the vault setup doc is handled separately)
const SIMPLE_COLLECTIONS = [
  'routines',
  'dailyLogs',
  'goals',
  'categories',
  'transactions',
  'budgets',
  'bills',
  'vaultItems',
]

const LOCAL_KEYS = ['tracko-palette', 'tracko-mode', 'tracko-vault-idle']

// runs one step, and if it fails, says exactly which step it was
async function step(label, fn) {
  try {
    return await fn()
  } catch (err) {
    console.error(`DELETE FAILED at: ${label} | code: ${err?.code} | ${err?.message}`)
    err.step = label
    throw err
  }
}

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
    await step(`collection "${name}"`, async () => {
      const snap = await getDocs(collection(db, 'users', uid, name))
      await deleteRefs(snap.docs.map((d) => d.ref))
    })
  }

  // the vault setup is one document, deleted directly (the rules do not allow listing it)
  await step('vault setup', () => deleteRefs([doc(db, 'users', uid, 'vault', 'meta')]))

  const goals = await step('reading savingsGoals', () =>
    getDocs(collection(db, 'users', uid, 'savingsGoals')),
  )
  for (const g of goals.docs) {
    await step(`savings entries of goal ${g.id}`, async () => {
      const entries = await getDocs(collection(g.ref, 'entries'))
      await deleteRefs(entries.docs.map((d) => d.ref))
    })
  }
  await step('savingsGoals', () => deleteRefs(goals.docs.map((d) => d.ref)))

  // the profile goes last
  await step('profile document', () => deleteRefs([doc(db, 'users', uid)]))
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
  await step('password check', () => reauthenticate(user, password))
  await wipeUserData(uid)
  clearLocalSettings(uid)
  await step('deleting the login', () => deleteUser(auth.currentUser))
}