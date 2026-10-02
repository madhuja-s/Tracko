import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubProfile = null

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }
      if (u) {
        unsubProfile = onSnapshot(
          doc(db, 'users', u.uid),
          (snap) => {
            setProfile(snap.exists() ? snap.data() : null)
            setLoading(false)
          },
          (err) => {
            console.error(err)
            setLoading(false)
          },
        )
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}