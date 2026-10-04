import { useEffect, useState } from 'react'

// the browser fires this event once, early, so we catch it right away
let deferred = null
const listeners = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((fn) => fn())
  })
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export function useInstallPrompt() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1)
    listeners.add(refresh)
    return () => listeners.delete(refresh)
  }, [])

  async function install() {
    if (!deferred) return false
    deferred.prompt()
    const choice = await deferred.userChoice
    deferred = null
    setTick((n) => n + 1)
    return choice.outcome === 'accepted'
  }

  return {
    canInstall: !!deferred,
    installed: isStandalone(),
    isIOS: /iphone|ipad|ipod/i.test(navigator.userAgent),
    install,
  }
}