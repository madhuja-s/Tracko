import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Routes, useLocation } from 'react-router-dom'
import SideTabs, { TAB_STRIP, useShowNav } from './SideTabs'
import './pageflip.css'

const FLIP_MS = 600

// deeper pages flip forward, going back flips backward
const DEPTH = {
  '/login': 0,
  '/signup': 1,
  '/forgot': 1,
  '/verify': 1,
  '/onboarding': 2,
  '/': 2,
  '/more': 2,
}
const depthOf = (path) => {
  if (path in DEPTH) return DEPTH[path]
  // money pages: /money is 3, /money/bills is 4, /money/savings/abc is 5
  if (path.startsWith('/money')) return 2 + path.split('/').filter(Boolean).length
  // every other page opens from Today or More
  return 3
}

// moving between the tabs flips in tab order, top to bottom
const TAB_ORDER = { '/': 0, '/money': 1, '/insights': 2, '/vault': 3, '/more': 4 }
function directionFor(fromPath, toPath) {
  if (fromPath in TAB_ORDER && toPath in TAB_ORDER) {
    return TAB_ORDER[toPath] >= TAB_ORDER[fromPath] ? 'fwd' : 'back'
  }
  return depthOf(toPath) >= depthOf(fromPath) ? 'fwd' : 'back'
}

function Binding() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[26px]">
      <div className="absolute inset-0 bg-softblush dark:bg-dark-card shadow-[2px_0_6px_rgba(59,55,53,0.14)]" />
      <div className="relative flex flex-col gap-[62px] pt-10">
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} className="relative h-[10px]">
            <span className="binding-hole" />
            <span className="binding-ring" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PageFlip({ children }) {
  const location = useLocation()
  const showNav = useShowNav()
  const prev = useRef(location)
  const timer = useRef(null)
  const [state, setState] = useState({ from: null, to: location, dir: 'fwd' })

  useLayoutEffect(() => {
    if (location.pathname === prev.current.pathname) return

    const from = prev.current
    prev.current = location
    const dir = directionFor(from.pathname, location.pathname)

    setState({ from, to: location, dir })
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => setState((s) => ({ ...s, from: null })),
      FLIP_MS + 40,
    )
  }, [location])

  useEffect(() => () => clearTimeout(timer.current), [])

  const animating = !!state.from
  const fwd = state.dir === 'fwd'

  // forward: the old page turns away and reveals the new one underneath
  // back: the new page turns back over the old one
  const baseLoc = animating ? (fwd ? state.to : state.from) : location
  const leafLoc = animating ? (fwd ? state.from : state.to) : null

  return (
    <div className="h-dvh bg-softblush dark:bg-dark-bg">
      <div className="relative mx-auto h-full max-w-[560px] overflow-hidden bg-cream dark:bg-dark-bg shadow-xl">
        {/* the strip the tabs stick out from */}
        {showNav && (
          <div
            className="absolute inset-y-0 right-0 bg-softblush dark:bg-dark-card"
            style={{ width: TAB_STRIP }}
          />
        )}

        <div
          className={`absolute inset-y-0 left-[26px] ${
            showNav ? 'shadow-[3px_0_8px_rgba(59,55,53,0.14)]' : ''
          }`}
          style={{ right: showNav ? TAB_STRIP : 0, perspective: '1500px' }}
        >
          <div className="page-scroll absolute inset-0 overflow-y-auto bg-cream dark:bg-dark-bg">
            <Routes location={baseLoc}>{children}</Routes>
          </div>

          {animating && (
            <div
              className={`leaf ${fwd ? 'leaf-fwd' : 'leaf-back'}`}
              style={{ pointerEvents: 'none' }}
            >
              <div className="face">
                <div className="page-scroll absolute inset-0 overflow-y-auto">
                  <Routes location={leafLoc}>{children}</Routes>
                </div>
                <div className="shade-front" />
              </div>
              <div className="face face-back">
                <div className="ruled-lines" />
                <div className="shade-back" />
              </div>
            </div>
          )}
        </div>

        <Binding />
        {showNav && <SideTabs />}
      </div>
    </div>
  )
}