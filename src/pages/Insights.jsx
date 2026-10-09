import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRoutineData } from '../hooks/useRoutineData'
import { useTransactions } from '../hooks/useFinance'
import { useSavingsGoals } from '../hooks/useSavings'
import { todayInZone, weekdayOf, shortDate, DAY_LABELS } from '../utils/dates'
import { computeStreak, bestStreak } from '../utils/stats'
import {
  dailySeries,
  weeklySeries,
  heatmapCells,
  habitConsistency,
  monthRanges,
  bucketByMonth,
  dailySpending,
  compactMoney,
} from '../utils/insights'
import { money, round2 } from '../utils/money'
import { BarChart, GroupedBars, Heatmap } from '../components/Charts'

const card = 'bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-5 sm:p-6'

function RoutineInsights({ uid, tz }) {
  const today = todayInZone(tz)
  const { tasks, logs, ready } = useRoutineData(uid)

  const hasData = Object.keys(logs).length > 0
  const daily = useMemo(() => dailySeries(tasks, logs, today, 7), [tasks, logs, today])
  const weekly = useMemo(() => weeklySeries(tasks, logs, today, 4), [tasks, logs, today])
  const cells = useMemo(() => heatmapCells(tasks, logs, today, 5), [tasks, logs, today])
  const habits = useMemo(
    () => habitConsistency(tasks, logs, today, 30, tz),
    [tasks, logs, today, tz],
  )
  const streak = useMemo(() => computeStreak(tasks, logs, today), [tasks, logs, today])
  const best = useMemo(() => bestStreak(tasks, logs, today), [tasks, logs, today])
  const weekAvg = weekly[weekly.length - 1]?.avg ?? 0

  if (!ready) return <p className="mt-6 font-semibold text-deepsage">Loading... 🌸</p>

  if (!hasData) {
    return (
      <div className={`mt-4 ${card}`}>
        <p className="font-bold">No data yet</p>
        <p className="mt-1 text-sm opacity-70">
          Tick a few tasks on the Today page, and your charts will appear here.
        </p>
      </div>
    )
  }

  const dailyBars = daily.map((d) => ({
    key: d.date,
    value: d.percent,
    top: d.percent === null ? null : `${d.percent}%`,
    label: DAY_LABELS[weekdayOf(d.date)],
    title:
      d.percent === null
        ? `${shortDate(d.date)}: no tasks`
        : `${shortDate(d.date)}: ${d.done} of ${d.total} done`,
  }))

  const weeklyBars = weekly.map((w) => ({
    key: w.start,
    value: w.days === 0 ? null : w.avg,
    top: w.days === 0 ? null : `${w.avg}%`,
    label: shortDate(w.start),
    title: `Week of ${shortDate(w.start)}: ${w.full} of ${w.days} days fully done`,
  }))

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-deepsage dark:text-sage">🔥 {streak}</p>
          <p className="text-xs opacity-70">day streak</p>
        </div>
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-deepsage dark:text-sage">
            🏆 {Math.max(best, streak)}
          </p>
          <p className="text-xs opacity-70">best streak</p>
        </div>
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-deepsage dark:text-sage">{weekAvg}%</p>
          <p className="text-xs opacity-70">this week</p>
        </div>
      </div>

      <div className={card}>
        <h2 className="font-bold">Last 7 days</h2>
        <p className="mb-3 text-xs opacity-70">How much of each day's routine you finished.</p>
        <BarChart
          bars={dailyBars}
          max={100}
          ariaLabel="Bar chart of routine completion for the last 7 days"
        />
      </div>

      <div className={card}>
        <h2 className="font-bold">Last 4 weeks</h2>
        <p className="mb-3 text-xs opacity-70">
          Average completion per week. Weeks run Monday to Sunday.
        </p>
        <BarChart
          bars={weeklyBars}
          max={100}
          height={130}
          ariaLabel="Bar chart of average routine completion for the last 4 weeks"
        />
      </div>

      <div className={card}>
        <h2 className="font-bold">Your last 5 weeks</h2>
        <p className="mb-3 text-xs opacity-70">
          The greener a day, the more you finished. Dashed days had no tasks or no data.
        </p>
        <Heatmap cells={cells} ariaLabel="Calendar showing routine completion per day" />
      </div>

      <div className={card}>
        <h2 className="font-bold">Habit consistency</h2>
        <p className="mb-3 text-xs opacity-70">
          How often you did each task on its scheduled days, in the last 30 days.
        </p>
        {habits.length === 0 && <p className="text-sm opacity-70">Not enough data yet.</p>}
        <div className="space-y-3">
          {habits.map((h) => (
            <div key={h.id}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate font-semibold">{h.name}</span>
                <span className="shrink-0">
                  {h.percent}% <span className="opacity-60">({h.done}/{h.scheduled})</span>
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/70 dark:bg-dark-bg">
                <div
                  className="h-full bg-sage transition-all duration-500"
                  style={{ width: `${h.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MoneyInsights({ uid, profile }) {
  const today = todayInZone(profile?.timeZone)
  const startDay = profile?.financeMonthStart ?? 1

  const ranges = useMemo(() => monthRanges(today, startDay, 6), [today, startDay])
  const items = useTransactions(uid, ranges[0].start, ranges[ranges.length - 1].end)
  const { goals } = useSavingsGoals(uid)

  const months = useMemo(() => bucketByMonth(items, ranges), [items, ranges])
  const current = months[months.length - 1]

  const withSpend = months.filter((m) => m.spent > 0)
  const avgSpend = withSpend.length
    ? round2(withSpend.reduce((sum, m) => sum + m.spent, 0) / withSpend.length)
    : 0
  const left = round2(current.income - current.spent)

  const daily = useMemo(
    () => dailySpending(items, current.start, current.end, today),
    [items, current.start, current.end, today],
  )
  const avgPerDay = daily.length ? round2(current.spent / daily.length) : 0

  const savedTotal = round2(goals.reduce((sum, g) => sum + (g.saved || 0), 0))
  const targetTotal = round2(goals.reduce((sum, g) => sum + (g.target || 0), 0))
  const savedPct = targetTotal > 0 ? Math.min(100, Math.round((savedTotal / targetTotal) * 100)) : 0

  if (items.length === 0 && goals.length === 0) {
    return (
      <div className={`mt-4 ${card}`}>
        <p className="font-bold">No data yet</p>
        <p className="mt-1 text-sm opacity-70">
          Add a few entries on the Money page, and your charts will appear here.
        </p>
      </div>
    )
  }

  const groups = months.map((m) => ({
    key: m.start,
    label: m.label,
    a: m.income,
    b: m.spent,
    title: `${m.label}: income ${money(m.income)}, spent ${money(m.spent)}`,
  }))

  const dailyBars = daily.map((d) => ({
    key: d.date,
    value: d.amount,
    label: String(Number(d.date.slice(8))),
    title: `${shortDate(d.date)}: ${money(d.amount)}`,
  }))

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-xs opacity-70">Spent</p>
          <p className="mt-1 font-extrabold">{compactMoney(current.spent)}</p>
          <p className="text-[10px] opacity-60">this month</p>
        </div>
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-xs opacity-70">Average</p>
          <p className="mt-1 font-extrabold">{compactMoney(avgSpend)}</p>
          <p className="text-[10px] opacity-60">per month</p>
        </div>
        <div className="bg-softblush dark:bg-dark-card rounded-3xl shadow-sm p-4 text-center">
          <p className="text-xs opacity-70">Left</p>
          <p
            className={`mt-1 font-extrabold ${
              left < 0 ? 'text-red-600' : 'text-deepsage dark:text-sage'
            }`}
          >
            {compactMoney(left)}
          </p>
          <p className="text-[10px] opacity-60">this month</p>
        </div>
      </div>

      <div className={card}>
        <h2 className="font-bold">Income vs spending</h2>
        <p className="mb-3 text-xs opacity-70">Your last 6 finance months.</p>
        <GroupedBars
          groups={groups}
          aName="Income"
          bName="Spent"
          ariaLabel="Bar chart comparing income and spending for the last 6 months"
        />
        <div className="mt-4 space-y-1.5">
          {[...months].reverse().map((m) => {
            const net = round2(m.income - m.spent)
            return (
              <div
                key={m.start}
                className="rounded-xl bg-white/50 dark:bg-dark-bg px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{m.label}</span>
                  <span
                    className={`font-bold ${
                      net < 0 ? 'text-red-600' : 'text-deepsage dark:text-sage'
                    }`}
                  >
                    {money(net)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap justify-between gap-x-3 gap-y-0.5 opacity-80">
                  <span>In {money(m.income)}</span>
                  <span>Out {money(m.spent)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={card}>
        <h2 className="font-bold">Daily spending this month</h2>
        <p className="mb-3 text-xs opacity-70">
          You spend about {money(avgPerDay)} a day. Today is the pink bar.
        </p>
        <BarChart
          bars={dailyBars}
          labelEvery={5}
          height={130}
          ariaLabel="Bar chart of money spent on each day this month"
        />
      </div>

      <div className={card}>
        <h2 className="font-bold">Savings goals</h2>
        {goals.length === 0 ? (
          <p className="mt-1 text-sm opacity-70">No savings goals yet.</p>
        ) : (
          <>
            <div className="mt-3 flex justify-between gap-3 text-sm">
              <span className="font-semibold">{money(savedTotal)} saved</span>
              <span className="opacity-70">of {money(targetTotal)}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/70 dark:bg-dark-bg">
              <div
                className="h-full bg-sage transition-all duration-500"
                style={{ width: `${savedPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs opacity-70">
              {goals.length} goal{goals.length === 1 ? '' : 's'} · {savedPct}% of the way there
            </p>
          </>
        )}
        <Link
          to="/money/savings"
          className="mt-3 inline-block text-sm font-bold text-deepsage dark:text-sage"
        >
          Open savings goals →
        </Link>
      </div>
    </div>
  )
}

export default function Insights() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('routine')

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto pb-10">
      <Link to="/" className="text-sm font-bold text-deepsage dark:text-sage">
        ← Back to today
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-deepsage dark:text-sage">
        Insights 📊
      </h1>

      <div className="mt-4 flex gap-2">
        {[
          ['routine', '🌸 Routine'],
          ['money', '💰 Money'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full py-2 text-sm font-bold border-2 transition ${
              tab === id ? 'bg-blush border-blush text-charcoal' : 'border-sage/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'routine' ? (
        <RoutineInsights uid={user.uid} tz={profile?.timeZone} />
      ) : (
        <MoneyInsights uid={user.uid} profile={profile} />
      )}
    </div>
  )
}