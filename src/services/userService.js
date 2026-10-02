import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export const getTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone

export async function createUserProfile(user, extra = {}) {
  await setDoc(doc(db, 'users', user.uid), {
    name: user.displayName || '',
    email: user.email,
    age: null,
    goals: [],
    goalText: '',
    timeZone: getTimeZone(),
    reminderTime: '08:00',
    theme: 'light',
    onboardingDone: false,
    createdAt: serverTimestamp(),
    ...extra,
  })
}

// used for Google login: create the profile only if it does not exist yet
export async function ensureProfile(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) await createUserProfile(user)
}