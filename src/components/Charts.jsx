// simple charts built from plain HTML, coloured by the chosen palette

export function BarChart({ bars, height = 150, max, labelEvery = 1, ariaLabel }) {
  const top = max ?? Math.max(1, ...bars.map((b) => b.value ?? 0))

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {bars.map((b, i) => {
          const empty = b.value === null || b.value === undefined
          const last = i === bars.length - 1
          const pct = empty ? 0 : (b.value / top) * 85

          return (
            <div
              key={b.key ?? i}
              title={b.title}
              className="flex h-full flex-1 flex-col items-center justify-end"
            >
              {empty ? (
                <span className="mb-1 text-[10px] opacity-50">–</span>
              ) : (
                <>
                  {b.top && <span className="mb-1 text-[10px] font-bold">{b.top}</span>}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      b.value === 0 ? 'bg-sage/40' : last ? 'bg-blush' : 'bg-sage'
                    }`}
                    style={{ height: `${Math.max(pct, b.value > 0 ? 4 : 1.5)}%` }}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-1 flex gap-1.5">
        {bars.map((b, i) => (
          <span key={b.key ?? i} className="flex-1 text-center text-[10px] opacity-70">
            {i % labelEvery === 0 ? b.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

export function GroupedBars({ groups, height = 150, ariaLabel, aName, bName }) {
  const top = Math.max(1, ...groups.flatMap((g) => [g.a, g.b]))

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="flex items-end gap-3" style={{ height }}>
        {groups.map((g) => (
          <div
            key={g.key}
            title={g.title}
            className="flex h-full flex-1 items-end justify-center gap-1"
          >
            <div
              className="w-1/2 rounded-t-md bg-sage transition-all duration-500"
              style={{ height: `${Math.max((g.a / top) * 100, g.a > 0 ? 3 : 1)}%` }}
            />
            <div
              className="w-1/2 rounded-t-md bg-blush transition-all duration-500"
              style={{ height: `${Math.max((g.b / top) * 100, g.b > 0 ? 3 : 1)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-1 flex gap-3">
        {groups.map((g) => (
          <span key={g.key} className="flex-1 text-center text-[10px] opacity-70">
            {g.label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-5 text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-sage" /> {aName}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-blush" /> {bName}
        </span>
      </div>
    </div>
  )
}

export function Heatmap({ cells, ariaLabel }) {
  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] opacity-70">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {cells.map((c) =>
          c.future ? (
            <div key={c.date} className="aspect-square" />
          ) : (
            <div
              key={c.date}
              title={
                c.percent === null
                  ? `${c.date}: no data`
                  : `${c.date}: ${c.done} of ${c.total} done`
              }
              className={`flex aspect-square items-center justify-center rounded-lg border text-[10px] ${
                c.percent === null ? 'border-dashed border-sage/40 opacity-60' : 'border-transparent'
              }`}
              style={
                c.percent === null
                  ? undefined
                  : {
                      backgroundColor: `color-mix(in srgb, var(--color-sage) ${Math.max(
                        c.percent,
                        10,
                      )}%, transparent)`,
                    }
              }
            >
              {Number(c.date.slice(8))}
            </div>
          ),
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] opacity-70">
        <span>Less</span>
        {[10, 35, 60, 85, 100].map((p) => (
          <span
            key={p}
            className="h-3 w-3 rounded-sm"
            style={{
              backgroundColor: `color-mix(in srgb, var(--color-sage) ${p}%, transparent)`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}