import { createContext, useContext, useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { PALETTES } from '../data/palettes'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

const MODES = ['light', 'dark', 'system']
const validPalette = (id) => PALETTES.some((p) => p.id === id)
const validMode = (m) => MODES.includes(m)

function readLocal(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage blocked: the choice still works until the page is closed
  }
}

export function ThemeProvider({ children }) {
  const { user, profile } = useAuth()

  const [palette, setPaletteState] = useState(() => {
    const p = readLocal('tracko-palette', 'blush')
    return validPalette(p) ? p : 'blush'
  })
  const [mode, setModeState] = useState(() => {
    const m = readLocal('tracko-mode', 'light')
    return validMode(m) ? m : 'light'
  })
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const [adoptedFor, setAdoptedFor] = useState(null)

  // when you log in on a new device, use the look saved on your account
  useEffect(() => {
    if (!user || !profile || adoptedFor === user.uid) return
    setAdoptedFor(user.uid)
    if (validPalette(profile.palette)) {
      setPaletteState(profile.palette)
      writeLocal('tracko-palette', profile.palette)
    }
    if (validMode(profile.mode)) {
      setModeState(profile.mode)
      writeLocal('tracko-mode', profile.mode)
    }
  }, [user, profile, adoptedFor])

  // follow the phone's light/dark setting when mode is "system"
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setSystemDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const dark = mode === 'dark' || (mode === 'system' && systemDark)

  // apply to the page
  useEffect(() => {
    const root = document.documentElement
    root.dataset.palette = palette
    root.classList.toggle('dark', dark)

    const meta = document.querySelector('meta[name="theme-color"]')
    const current = PALETTES.find((p) => p.id === palette)
    if (meta && current) meta.setAttribute('content', dark ? '#1E1B1C' : current.colors[0])
  }, [palette, dark])

  function save(fields) {
    if (!user) return
    updateDoc(doc(db, 'users', user.uid), fields).catch(console.error)
  }

  function setPalette(id) {
    if (!validPalette(id)) return
    setPaletteState(id)
    writeLocal('tracko-palette', id)
    save({ palette: id })
  }

  function setMode(m) {
    if (!validMode(m)) return
    setModeState(m)
    writeLocal('tracko-mode', m)
    save({ mode: m })
  }

  return (
    <ThemeContext.Provider value={{ palette, mode, dark, setPalette, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}