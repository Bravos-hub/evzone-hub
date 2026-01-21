import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

type DaySchedule = {
  key: string
  closed: boolean
  open: string
  close: string
}

type Exception = {
  id: string
  date: string
  closed: boolean
  open: string
  close: string
}

type Availability = {
  schedule: DaySchedule[]
  exceptions: Exception[]
  override: {
    mode: 'none' | 'open' | 'closed'
    until: string
  }
}

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function mnts(t: string): number {
  const [h, m] = String(t || '').split(':').map((x) => parseInt(x || '0', 10))
  return (h || 0) * 60 + (m || 0)
}

function toISODate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getDayKey(d: Date = new Date()): string {
  return DAY_KEYS[(d.getDay() + 6) % 7]
}

function computeOpenNow(av: Availability, now: Date = new Date()) {
  const hasOverride = av?.override?.mode && av.override.mode !== 'none'
  const until = av?.override?.until ? new Date(av.override.until) : null
  const notExpired = hasOverride && (!until || until > now)
  if (hasOverride && notExpired) return { open: av.override.mode === 'open', source: 'Manual override' }
  const todayISO = toISODate(now)
  const ex = (av?.exceptions || []).find((e) => e.date === todayISO)
  if (ex) {
    if (ex.closed) return { open: false, source: 'Exception' }
    const cur = now.getHours() * 60 + now.getMinutes()
    return { open: cur >= mnts(ex.open) && cur < mnts(ex.close), source: 'Exception hours' }
  }
  const day = (av?.schedule || []).find((d) => d.key === getDayKey(now)) || { closed: true, open: '00:00', close: '00:00' }
  if (day.closed) return { open: false, source: 'Weekly schedule' }
  const cur = now.getHours() * 60 + now.getMinutes()
  return { open: cur >= mnts(day.open) && cur < mnts(day.close), source: 'Weekly schedule' }
}

function computeTodaySegments(av: Availability, now: Date = new Date()) {
  const minutes = new Array(1440).fill(false)
  const todayISO = toISODate(now)
  const dayKey = getDayKey(now)
  const ex = (av?.exceptions || []).find((e) => e.date === todayISO)
  if (ex) {
    if (!ex.closed) {
      for (let m = mnts(ex.open); m < Math.min(mnts(ex.close), 1440); m++) minutes[m] = true
    }
  } else {
    const day = (av?.schedule || []).find((x) => x.key === dayKey)
    if (day && !day.closed) {
      for (let m = mnts(day.open); m < Math.min(mnts(day.close), 1440); m++) minutes[m] = true
    }
  }
  const hasOverride = av?.override?.mode && av.override.mode !== 'none'
  const untilDate = av?.override?.until ? new Date(av.override.until) : null
  const notExpired = hasOverride && (!untilDate || untilDate > now)
  if (hasOverride && notExpired) {
    const start = now.getHours() * 60 + now.getMinutes()
    let untilMin = 1440
    if (untilDate && untilDate.toDateString() === now.toDateString()) untilMin = untilDate.getHours() * 60 + untilDate.getMinutes()
    for (let m = start; m < Math.min(untilMin, 1440); m++) minutes[m] = av.override.mode === 'open'
  }
  const segs: Array<{ start: number; end: number; open: boolean }> = []
  let curOpen = minutes[0]
  let start = 0
  for (let m = 1; m <= 1440; m++) {
    const v = m < 1440 ? minutes[m] : !curOpen
    if (v !== curOpen) {
      segs.push({ start, end: m, open: curOpen })
      start = m
      curOpen = v
    }
  }
  return segs
}

function nextCloseInMinutes(av: Availability, now: Date = new Date()) {
  const segs = computeTodaySegments(av, now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const cur = segs.find((s) => s.open && nowMin >= s.start && nowMin < s.end)
  return cur ? cur.end - nowMin : null
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { key: 'Mon', closed: false, open: '07:00', close: '21:00' },
  { key: 'Tue', closed: false, open: '07:00', close: '21:00' },
  { key: 'Wed', closed: false, open: '07:00', close: '21:00' },
  { key: 'Thu', closed: false, open: '07:00', close: '21:00' },
  { key: 'Fri', closed: false, open: '07:00', close: '21:00' },
  { key: 'Sat', closed: false, open: '08:00', close: '20:00' },
  { key: 'Sun', closed: true, open: '09:00', close: '18:00' },
]

const IconClock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Operator Availability - Operator feature
 * Manage station availability: weekly schedule, exceptions, manual override
 */
export function OperatorAvailability() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'stations')
  const [searchParams] = useSearchParams()
  const stationId = searchParams.get('stationId') || 'STN-001'

  const [availability, setAvailability] = useState<Availability>({
    schedule: DEFAULT_SCHEDULE,
    exceptions: [],
    override: { mode: 'none', until: '' },
  })

  // Ensure all days are present
  useEffect(() => {
    setAvailability((a) => {
      const have = new Set((a.schedule || []).map((d) => d.key))
      const missing = DEFAULT_SCHEDULE.filter((d) => !have.has(d.key))
      return missing.length ? { ...a, schedule: [...a.schedule, ...missing] } : a
    })
  }, [])

  const eff = computeOpenNow(availability)
  const minsToClose = nextCloseInMinutes(availability)
  const segs = computeTodaySegments(availability)

  function patchDay(key: string, patch: Partial<DaySchedule>) {
    setAvailability((a) => ({
      ...a,
      schedule: a.schedule.map((d) => (d.key === key ? { ...d, ...patch } : d)),
    }))
  }

  function addEx() {
    setAvailability((a) => ({
      ...a,
      exceptions: [
        ...a.exceptions,
        { id: `ex-${Date.now()}`, date: '', closed: true, open: '09:00', close: '17:00' },
      ],
    }))
  }

  function patchEx(id: string, patch: Partial<Exception>) {
    setAvailability((a) => ({
      ...a,
      exceptions: a.exceptions.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }))
  }

  function rmEx(id: string) {
    setAvailability((a) => ({
      ...a,
      exceptions: a.exceptions.filter((e) => e.id !== id),
    }))
  }

  function save() {
    alert('Availability saved (demo)')
  }

  if (!perms.edit) {
    return (
      <DashboardLayout pageTitle="Station Availability">
        <Card>
          <p className="text-muted">You don't have permission to edit availability.</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={`Station Availability — ${stationId}`}>
      {/* Status badge + timeline */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-2 text-sm">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                eff.open ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {eff.open ? 'Open now' : 'Closed now'}
            </span>
            {eff.open && minsToClose != null && <span className="text-muted">Closes in {minsToClose} min</span>}
          </div>
          <div className="text-xs text-muted inline-flex items-center gap-1">
            <IconClock /> Effective today
          </div>
        </div>
        <svg viewBox="0 0 1440 20" className="w-full h-6 mt-2">
          {segs.map((s, i) => (
            <rect
              key={i}
              x={s.start}
              y={6}
              width={Math.max(1, s.end - s.start)}
              height={8}
              fill={s.open ? '#22c55e' : '#f59e0b'}
              rx="2"
            />
          ))}
          <line
            x1={new Date().getHours() * 60 + new Date().getMinutes()}
            x2={new Date().getHours() * 60 + new Date().getMinutes()}
            y1="2"
            y2="18"
            stroke="#0ea5e9"
            strokeWidth="2"
          />
        </svg>
      </Card>

      {/* Manual override */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-3">Manual override</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn secondary"
            onClick={() => setAvailability((a) => ({ ...a, override: { ...a.override, mode: 'closed' } }))}
          >
            Close now
          </button>
          <button
            className="btn secondary"
            onClick={() => setAvailability((a) => ({ ...a, override: { ...a.override, mode: 'open' } }))}
          >
            Reopen now
          </button>
          <button
            className="btn secondary"
            onClick={() => setAvailability((a) => ({ ...a, override: { mode: 'none', until: '' } }))}
          >
            Clear
          </button>
          <label className="ml-auto text-sm inline-flex items-center gap-2">
            Until
            <input
              type="datetime-local"
              value={availability.override.until}
              onChange={(e) => setAvailability((a) => ({ ...a, override: { ...a.override, until: e.target.value } }))}
              className="rounded border border-border"
            />
          </label>
        </div>
        <p className="text-xs text-muted mt-2">Precedence: Manual override → Exceptions → Weekly schedule.</p>
      </Card>

      {/* Weekly schedule */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-2">Weekly schedule</h3>
        <div className="grid grid-cols-12 bg-surface-alt text-xs font-semibold text-muted rounded-t-lg">
          <div className="col-span-3 px-3 py-2">Day</div>
          <div className="col-span-3 px-3 py-2">Open</div>
          <div className="col-span-3 px-3 py-2">Close</div>
          <div className="col-span-3 px-3 py-2">Closed</div>
        </div>
        <ul className="divide-y divide-border border border-border rounded-b-lg">
          {availability.schedule.map((d) => {
            const bad = !d.closed && mnts(d.close) <= mnts(d.open)
            return (
              <li key={d.key} className="grid grid-cols-12 items-center">
                <div className="col-span-3 px-3 py-2 text-sm">{d.key}</div>
                <div className="col-span-3 px-3 py-2">
                  <input
                    type="time"
                    disabled={d.closed}
                    className="rounded border border-border w-full px-2 py-1"
                    value={d.open}
                    onChange={(e) => patchDay(d.key, { open: e.target.value })}
                  />
                </div>
                <div className="col-span-3 px-3 py-2">
                  <input
                    type="time"
                    disabled={d.closed}
                    className="rounded border border-border w-full px-2 py-1"
                    value={d.close}
                    onChange={(e) => patchDay(d.key, { close: e.target.value })}
                  />
                </div>
                <div className="col-span-3 px-3 py-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={d.closed}
                      onChange={(e) => patchDay(d.key, { closed: e.target.checked })}
                      className="rounded border-border"
                    />
                    Closed
                  </label>
                </div>
                {!d.closed && bad && (
                  <div className="col-span-12 px-3 pb-2 text-xs text-red-600">End time must be after Start time.</div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Exceptions */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Exceptions</h3>
          <button className="btn primary" onClick={addEx}>
            + Add
          </button>
        </div>
        {availability.exceptions.length === 0 && <div className="text-sm text-muted">No exceptions.</div>}
        <ul className="space-y-3">
          {availability.exceptions.map((ex) => {
            const bad = !ex.closed && mnts(ex.close) <= mnts(ex.open)
            return (
              <li key={ex.id} className="rounded border border-border p-3">
                <div className="grid md:grid-cols-4 gap-3">
                  <input
                    type="date"
                    className="rounded border border-border px-2 py-1"
                    value={ex.date}
                    onChange={(e) => patchEx(ex.id, { date: e.target.value })}
                  />
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={ex.closed}
                      onChange={(e) => patchEx(ex.id, { closed: e.target.checked })}
                      className="rounded border-border"
                    />
                    Closed all day
                  </label>
                  <input
                    type="time"
                    disabled={ex.closed}
                    className="rounded border border-border px-2 py-1"
                    value={ex.open}
                    onChange={(e) => patchEx(ex.id, { open: e.target.value })}
                  />
                  <input
                    type="time"
                    disabled={ex.closed}
                    className="rounded border border-border px-2 py-1"
                    value={ex.close}
                    onChange={(e) => patchEx(ex.id, { close: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  {!ex.closed && bad && <div className="text-xs text-red-600">End time must be after Start time.</div>}
                  <button onClick={() => rmEx(ex.id)} className="text-red-600 text-sm hover:underline">
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button className="btn secondary" onClick={() => window.history.back()}>
          Cancel
        </button>
        <button className="btn primary" onClick={save}>
          Save
        </button>
      </div>
    </DashboardLayout>
  )
}

