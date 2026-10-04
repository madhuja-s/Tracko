import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { toCsv, downloadFile, stamp } from '../utils/csv'

async function readAll(uid, name) {
  const snap = await getDocs(collection(db, 'users', uid, name))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

const byDate = (a, b) => (a.date || '').localeCompare(b.date || '')

export async function exportMoneyCsv(uid) {
  const items = (await readAll(uid, 'transactions')).sort(byDate)
  const rows = items.map((t) => [
    t.date,
    t.type === 'income' ? 'Income' : 'Expense',
    t.categoryName || '',
    t.amount,
    t.note || '',
  ])
  downloadFile(
    `tracko-money-${stamp()}.csv`,
    toCsv(['Date', 'Type', 'Category', 'Amount (INR)', 'Note'], rows),
    'text/csv;charset=utf-8',
  )
  return rows.length
}

export async function exportRoutineCsv(uid) {
  const [logs, tasks] = await Promise.all([
    readAll(uid, 'dailyLogs'),
    readAll(uid, 'routines'),
  ])
  const nameOf = {}
  tasks.forEach((t) => {
    nameOf[t.id] = t.name
  })

  const rows = logs
    .map((l) => ({ ...l, date: l.date || l.id }))
    .sort(byDate)
    .map((l) => {
      const total = l.total || 0
      const done = l.doneCount ?? (l.doneIds || []).length
      return [
        l.date,
        done,
        total,
        total ? Math.round((done / total) * 100) : '',
        (l.doneIds || []).map((id) => nameOf[id] || '(deleted task)').join('; '),
      ]
    })

  downloadFile(
    `tracko-routine-${stamp()}.csv`,
    toCsv(['Date', 'Tasks done', 'Tasks scheduled', 'Percent', 'Done tasks'], rows),
    'text/csv;charset=utf-8',
  )
  return rows.length
}

export async function exportSavingsCsv(uid) {
  const goals = await readAll(uid, 'savingsGoals')
  const rows = []

  for (const g of goals) {
    const snap = await getDocs(collection(db, 'users', uid, 'savingsGoals', g.id, 'entries'))
    const entries = snap.docs.map((d) => d.data()).sort(byDate)
    if (entries.length === 0) {
      rows.push([g.name, g.target, g.startDate, g.endDate || '', '', '', ''])
    }
    entries.forEach((e) => {
      rows.push([g.name, g.target, g.startDate, g.endDate || '', e.date, e.amount, e.note || ''])
    })
  }

  downloadFile(
    `tracko-savings-${stamp()}.csv`,
    toCsv(
      ['Goal', 'Target (INR)', 'Start', 'End', 'Saved on', 'Amount (INR)', 'Note'],
      rows,
    ),
    'text/csv;charset=utf-8',
  )
  return rows.length
}

export async function exportBillsCsv(uid) {
  const bills = (await readAll(uid, 'bills')).sort((a, b) =>
    (a.nextDue || '').localeCompare(b.nextDue || ''),
  )
  const rows = bills.map((b) => [
    b.name,
    b.amount,
    b.frequency,
    b.categoryName || '',
    b.nextDue,
    b.lastPaid || '',
  ])
  downloadFile(
    `tracko-bills-${stamp()}.csv`,
    toCsv(['Bill', 'Amount (INR)', 'Repeats', 'Category', 'Next due', 'Last paid'], rows),
    'text/csv;charset=utf-8',
  )
  return rows.length
}

// everything, as one file you can keep as a backup
export async function exportBackupJson(uid) {
  const names = [
    'routines',
    'dailyLogs',
    'goals',
    'categories',
    'transactions',
    'budgets',
    'bills',
    'savingsGoals',
  ]

  const [profileSnap, ...lists] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    ...names.map((n) => readAll(uid, n)),
  ])

  const data = {
    app: 'Tracko',
    exportedAt: new Date().toISOString(),
    profile: profileSnap.exists() ? profileSnap.data() : null,
  }
  names.forEach((n, i) => {
    data[n] = lists[i]
  })

  // savings entries live inside each goal
  for (const g of data.savingsGoals) {
    const snap = await getDocs(collection(db, 'users', uid, 'savingsGoals', g.id, 'entries'))
    g.entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  const json = JSON.stringify(
    data,
    (key, value) => {
      if (
        value &&
        typeof value === 'object' &&
        typeof value.seconds === 'number' &&
        typeof value.nanoseconds === 'number'
      ) {
        return new Date(value.seconds * 1000).toISOString()
      }
      return value
    },
    2,
  )

  downloadFile(`tracko-backup-${stamp()}.json`, json, 'application/json')
}