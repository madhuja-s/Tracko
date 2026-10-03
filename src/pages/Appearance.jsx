import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { PALETTES } from '../data/palettes'

const MODE_OPTIONS = [
  { id: 'light', label: '☀️ Light' },
  { id: 'dark', label: '🌙 Dark' },
  { id: 'system', label: '📱 Auto' },
]

export default function Appearance() {
  const { palette, mode, setPalette, setMode } = useTheme()

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <Link to="/" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to today
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Colours 🎨
      </h1>
      <p className="text-sm opacity-70">Make Tracko look the way you like. It saves by itself.</p>

      <div className="mt-5 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
        <h2 className="font-bold">Pick your palette</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {PALETTES.map((p) => {
            const on = palette === p.id
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => setPalette(p.id)}
                className={`rounded-2xl border-2 p-3 text-left transition ${
                  on
                    ? 'border-deepsage bg-white/70 dark:bg-dark-bg'
                    : 'border-transparent bg-white/40 dark:bg-dark-bg/60'
                }`}
              >
                <div className="flex">
                  {p.colors.map((c, i) => (
                    <span
                      key={c}
                      className="h-7 w-7 rounded-full border-2 border-white/80"
                      style={{ backgroundColor: c, marginLeft: i === 0 ? 0 : -8 }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm font-bold">
                  {p.name}
                  {on ? ' ✓' : ''}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
        <h2 className="font-bold">Light or dark</h2>
        <div className="mt-3 flex gap-2">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 rounded-full py-2 text-sm font-bold border-2 transition ${
                mode === m.id ? 'bg-blush border-blush text-charcoal' : 'border-sage/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs opacity-70">
          Auto follows your phone or laptop setting.
        </p>
      </div>

      <div className="mt-4 bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-6">
        <h2 className="font-bold">Preview</h2>
        <div className="mt-3 h-3 rounded-full bg-white/70 dark:bg-dark-bg overflow-hidden">
          <div className="h-full w-2/3 bg-sage" />
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-blush px-4 py-2 text-sm font-bold text-charcoal">
            Button
          </span>
          <span className="rounded-full border-2 border-sage px-4 py-2 text-sm font-bold text-deepsage dark:text-sage">
            Outline
          </span>
        </div>
      </div>
    </div>
  )
}