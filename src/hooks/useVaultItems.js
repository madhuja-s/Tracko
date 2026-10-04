import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { decryptJson } from '../utils/vaultCrypto'

// live vault items, unlocked on your device. nothing is read while the vault is locked
export function useVaultItems(uid, key) {
  const [items, setItems] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!key) {
      setItems([])
      setReady(false)
      return
    }

    let latest = 0
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'vaultItems'),
      async (snap) => {
        const mine = ++latest
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const raw = d.data()
            const updatedAt = raw.updatedAt?.seconds ?? 9e12
            try {
              const plain = await decryptJson(key, { iv: raw.iv, data: raw.data }, uid)
              return { id: d.id, ok: true, updatedAt, ...plain }
            } catch {
              return {
                id: d.id,
                ok: false,
                updatedAt,
                title: '(could not open this item)',
                body: '',
                kind: 'note',
              }
            }
          }),
        )
        if (mine !== latest) return
        list.sort((a, b) => b.updatedAt - a.updatedAt)
        setItems(list)
        setReady(true)
      },
      (err) => console.error(err),
    )

    return () => {
      latest = Infinity
      unsub()
    }
  }, [uid, key])

  return { items, ready }
}