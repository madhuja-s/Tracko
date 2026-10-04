import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import {
  createVaultMeta,
  openWithPassword,
  openWithRecovery,
  makePasswordWrap,
} from '../utils/vaultCrypto'

const VaultContext = createContext(null)
export const useVault = () => useContext(VaultContext)

const IDLE_KEY = 'tracko-vault-idle'
const IDLE_CHOICES = [1, 5, 15, 30]

function readIdle() {
  try {
    const n = Number(localStorage.getItem(IDLE_KEY))
    return IDLE_CHOICES.includes(n) ? n : 5
  } catch {
    return 5
  }
}

export function VaultProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid

  // undefined = loading, null = no vault yet, "error" = could not read
  const [meta, setMeta] = useState(undefined)
  const [key, setKey] = useState(null)
  const [idleMinutes, setIdleState] = useState(readIdle)
  const lastActive = useRef(Date.now())

  // follow the vault settings document. logging out or switching account locks it
  useEffect(() => {
    setKey(null)
    setMeta(undefined)
    if (!uid) return

    return onSnapshot(
      doc(db, 'users', uid, 'vault', 'meta'),
      (snap) => setMeta(snap.exists() ? snap.data() : null),
      () => setMeta('error'),
    )
  }, [uid])

  // auto-lock when nothing has happened for a while
  useEffect(() => {
    if (!key) return

    lastActive.current = Date.now()
    const bump = () => {
      lastActive.current = Date.now()
    }
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'mousemove']
    events.forEach((e) => window.addEventListener(e, bump, { passive: true, capture: true }))

    const timer = setInterval(() => {
      if (Date.now() - lastActive.current > idleMinutes * 60000) setKey(null)
    }, 10000)

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump, { capture: true }))
      clearInterval(timer)
    }
  }, [key, idleMinutes])

  const status = !uid
    ? 'signed-out'
    : meta === undefined
      ? 'loading'
      : meta === 'error'
        ? 'error'
        : meta === null
          ? 'new'
          : key
            ? 'unlocked'
            : 'locked'

  // creates the vault and returns the recovery key (shown to you once)
  async function setup(password) {
    const ref = doc(db, 'users', uid, 'vault', 'meta')
    const existing = await getDoc(ref)
    if (existing.exists()) throw new Error('A vault already exists on this account.')

    const { meta: fresh, recoveryKey } = await createVaultMeta(password)
    await setDoc(ref, { ...fresh, createdAt: serverTimestamp() })
    return recoveryKey
  }

  async function unlock(password) {
    if (!meta || meta === 'error') throw new Error('The vault is not ready yet.')
    let dek
    try {
      dek = await openWithPassword(meta, password)
    } catch {
      throw new Error('That password is not right.')
    }
    lastActive.current = Date.now()
    setKey(dek)
  }

  // forgot the password: the recovery key sets a new one
  async function resetWithRecovery(recoveryKey, newPassword) {
    if (!meta || meta === 'error') throw new Error('The vault is not ready yet.')
    let dek
    try {
      dek = await openWithRecovery(meta, recoveryKey, true)
    } catch {
      throw new Error('That recovery key is not right.')
    }
    const wrap = await makePasswordWrap(dek, newPassword, meta.iter)
    await updateDoc(doc(db, 'users', uid, 'vault', 'meta'), {
      ...wrap,
      updatedAt: serverTimestamp(),
    })
    const opened = await openWithPassword({ ...meta, ...wrap }, newPassword)
    lastActive.current = Date.now()
    setKey(opened)
  }

  async function changePassword(currentPassword, newPassword) {
    let dek
    try {
      dek = await openWithPassword(meta, currentPassword, true)
    } catch {
      throw new Error('Your current password is not right.')
    }
    const wrap = await makePasswordWrap(dek, newPassword, meta.iter)
    await updateDoc(doc(db, 'users', uid, 'vault', 'meta'), {
      ...wrap,
      updatedAt: serverTimestamp(),
    })
  }

  function lock() {
    setKey(null)
  }

  function setIdleMinutes(n) {
    if (!IDLE_CHOICES.includes(n)) return
    setIdleState(n)
    try {
      localStorage.setItem(IDLE_KEY, String(n))
    } catch {
      // storage blocked: the choice lasts until you close the page
    }
  }

  return (
    <VaultContext.Provider
      value={{
        status,
        dek: key,
        setup,
        unlock,
        resetWithRecovery,
        changePassword,
        lock,
        idleMinutes,
        setIdleMinutes,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}