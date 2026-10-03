import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export async function saveReminderSettings(uid, { remindersOn, reminderTime }) {
  await updateDoc(doc(db, 'users', uid), { remindersOn, reminderTime })
}