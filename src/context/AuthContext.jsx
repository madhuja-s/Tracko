import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // bumping this number restarts the profile listener
  const [tick, setTick] = useState(0)

  // 1) who is logged in
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) {
        setProfile(null)
        setLoading(false)
      }
    })
    return unsubAuth
  }, [])

  // 2) live profile of that person (restarts when tick changes)
  const uid = user?.uid
  useEffect(() => {
    if (!uid) return
    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        setProfile(snap.exists() ? snap.data() : null)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setProfile(null)
        setLoading(false)
      },
    )
    return unsubProfile
  }, [uid, tick])

  // checks if the email is verified now. if yes: refreshes the login token,
  // runs onVerified (creates the profile), then restarts the profile listener
  const refreshUser = useCallback(async (onVerified) => {
    const u = auth.currentUser
    if (!u) return false
    await u.reload()
    if (!u.emailVerified) return false
    await u.getIdToken(true)
    if (onVerified) {
      try {
        await onVerified(u)
      } catch (err) {
        console.error(err)
      }
    }
    setTick((t) => t + 1)
    return true
  }, [])

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}