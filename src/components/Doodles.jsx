export function SavingsJar({ percent }) {
  const p = Math.max(0, Math.min(100, percent))
  const waterTop = 262 - (200 * p) / 100
  const coins = Math.min(7, Math.floor(p / 13))
  const coinSpots = [
    [70, 250],
    [100, 252],
    [128, 250],
    [84, 238],
    [114, 238],
    [98, 226],
    [72, 226],
  ]

  return (
    <svg
      viewBox="0 0 200 290"
      role="img"
      aria-label={`Savings jar, ${Math.round(p)} percent full`}
      className="w-full h-auto"
    >
      <defs>
        <clipPath id="jar-inside">
          <path d="M40 70 Q40 62 52 62 H148 Q160 62 160 70 V240 Q160 262 138 262 H62 Q40 262 40 240 Z" />
        </clipPath>
      </defs>

      {/* glass */}
      <path
        d="M40 70 Q40 62 52 62 H148 Q160 62 160 70 V240 Q160 262 138 262 H62 Q40 262 40 240 Z"
        fill="rgba(255,255,255,0.55)"
        stroke="rgba(59,55,53,0.35)"
        strokeWidth="3"
      />

      {/* water */}
      <g clipPath="url(#jar-inside)">
        <rect
          className="f-blush"
          x="40"
          y={waterTop}
          width="120"
          height={262 - waterTop}
          style={{ transition: 'all 0.8s ease' }}
        />
        {p > 0 && p < 100 && (
          <ellipse
            className="f-soft"
            cx="100"
            cy={waterTop}
            rx="60"
            ry="4"
            style={{ transition: 'all 0.8s ease' }}
          />
        )}
        {coinSpots.slice(0, coins).map(([cx, cy], i) => (
          <g key={i}>
            <circle className="f-cream s-sage" cx={cx} cy={cy} r="11" strokeWidth="3" />
            <text
              className="f-deep"
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
            >
              ₹
            </text>
          </g>
        ))}
      </g>

      {/* shine */}
      <path
        d="M54 90 V220"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* heart at the bottom */}
      <path
        className="f-blush"
        d="M100 276 C 88 266 84 258 92 256 C 96 255 99 258 100 260 C 101 258 104 255 108 256 C 116 258 112 266 100 276 Z"
        stroke="rgba(59,55,53,0.25)"
        strokeWidth="1.5"
        transform="translate(0 -6)"
      />

      {/* lid */}
      <rect
        className="f-blush"
        x="34"
        y="38"
        width="132"
        height="26"
        rx="8"
        stroke="rgba(59,55,53,0.35)"
        strokeWidth="3"
      />
      <rect x="64" y="46" width="72" height="6" rx="3" fill="rgba(59,55,53,0.25)" />

      {/* ribbon and bow */}
      <rect className="f-soft" x="42" y="68" width="116" height="10" stroke="rgba(59,55,53,0.2)" strokeWidth="2" />
      <ellipse className="f-blush" cx="92" cy="74" rx="12" ry="8" stroke="rgba(59,55,53,0.3)" strokeWidth="2" />
      <ellipse className="f-blush" cx="116" cy="74" rx="12" ry="8" stroke="rgba(59,55,53,0.3)" strokeWidth="2" />
      <circle className="f-soft" cx="104" cy="74" r="6" stroke="rgba(59,55,53,0.3)" strokeWidth="2" />
    </svg>
  )
}

export function PiggyBank({ className = '' }) {
  return (
    <svg viewBox="0 0 150 120" role="img" aria-label="Piggy bank" className={className}>
      {/* coin */}
      <circle className="f-cream s-sage" cx="68" cy="20" r="13" strokeWidth="3" />
      <text className="f-deep" x="68" y="26" textAnchor="middle" fontSize="16" fontWeight="800">
        ₹
      </text>

      {/* legs */}
      <rect className="f-blush" x="40" y="86" width="14" height="22" rx="6" stroke="rgba(59,55,53,0.35)" strokeWidth="3" />
      <rect className="f-blush" x="86" y="86" width="14" height="22" rx="6" stroke="rgba(59,55,53,0.35)" strokeWidth="3" />

      {/* tail */}
      <path
        d="M24 66 C 10 60 12 48 22 52"
        fill="none"
        stroke="rgba(59,55,53,0.4)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* body */}
      <ellipse className="f-blush" cx="68" cy="68" rx="48" ry="34" stroke="rgba(59,55,53,0.35)" strokeWidth="3" />

      {/* slot */}
      <rect x="54" y="38" width="28" height="5" rx="2.5" fill="rgba(59,55,53,0.35)" />

      {/* ear */}
      <path
        className="f-blush"
        d="M88 40 L100 26 L106 46 Z"
        stroke="rgba(59,55,53,0.35)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* snout */}
      <ellipse className="f-soft" cx="116" cy="68" rx="13" ry="11" stroke="rgba(59,55,53,0.35)" strokeWidth="3" />
      <circle cx="112" cy="68" r="2" fill="rgba(59,55,53,0.55)" />
      <circle cx="120" cy="68" r="2" fill="rgba(59,55,53,0.55)" />

      {/* eye and cheek */}
      <circle className="f-charcoal" cx="98" cy="58" r="3.2" />
      <ellipse className="f-soft" cx="92" cy="74" rx="6" ry="4" />
    </svg>
  )
}