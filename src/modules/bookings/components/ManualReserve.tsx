import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

type BookingType = 'charge' | 'swap'

type Connector = {
  id: string
  type: string
  kw: number
}

type Pack = {
  id: string
  label: string
}

type Locker = {
  id: string
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

function computeOpenNow(av: any, now: Date = new Date()) {
  const hasOverride = av?.override?.mode && av.override.mode !== 'none'
  const until = av?.override?.until ? new Date(av.override.until) : null
  const notExpired = hasOverride && (!until || until > now)
  if (hasOverride && notExpired) return { open: av.override.mode === 'open', source: 'Manual override' }
  const todayISO = toISODate(now)
  const ex = (av?.exceptions || []).find((e: any) => e.date === todayISO)
  if (ex) {
    if (ex.closed) return { open: false, source: 'Exception' }
    const cur = now.getHours() * 60 + now.getMinutes()
    return { open: cur >= mnts(ex.open) && cur < mnts(ex.close), source: 'Exception hours' }
  }
  const day = (av?.schedule || []).find((d: any) => d.key === getDayKey(now)) || { closed: true, open: '00:00', close: '00:00' }
  if (day.closed) return { open: false, source: 'Weekly schedule' }
  const cur = now.getHours() * 60 + now.getMinutes()
  return { open: cur >= mnts(day.open) && cur < mnts(day.close), source: 'Weekly schedule' }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Manual Reserve - Operator feature
 * Allows operators to manually create charging or swap reservations
 */
export function ManualReserve() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'bookings')
  const [searchParams] = useSearchParams()
  const stationId = searchParams.get('stationId') || 'STN-001'
  const type = (searchParams.get('type') || 'charge') as BookingType

  const [ack, setAck] = useState('')
  const [date, setDate] = useState(toISODate(new Date()))
  const [startTime, setStartTime] = useState('10:00')
  const [duration, setDuration] = useState(10)
  const [connectorId, setConnectorId] = useState('')
  const [packId, setPackId] = useState('')
  const [lockerId, setLockerId] = useState('auto')

  // Mock station data
  const station = useMemo(() => {
    if (type === 'charge') {
      return {
        id: stationId,
        name: 'EVzone — Central Hub (Charging)',
        connectors: [
          { id: 'EVSE-01', type: 'CCS2', kw: 150 },
          { id: 'EVSE-02', type: 'CCS2', kw: 150 },
          { id: 'EVSE-03', type: 'CHAdeMO', kw: 62.5 },
        ] as Connector[],
        bookingRules: { allowedDurations: [10, 20, 30], minBufferMin: 5, gracePeriodMin: 2 },
        availability: {
          schedule: [{ key: getDayKey(new Date()), closed: false, open: '06:00', close: '22:00' }],
          exceptions: [],
          override: { mode: 'none', until: '' },
        },
      }
    } else {
      return {
        id: stationId,
        name: 'EVzone — Bike Swap Central',
        packs: [
          { id: 'PK-48V_30Ah', label: '48V • 30Ah' },
          { id: 'PK-60V_32Ah', label: '60V • 32Ah' },
        ] as Pack[],
        lockers: [{ id: 'LK-01' }, { id: 'LK-02' }, { id: 'LK-03' }] as Locker[],
        bookingRules: { allowedDurations: [10, 20, 30], minBufferMin: 5, gracePeriodMin: 2 },
        availability: {
          schedule: [{ key: getDayKey(new Date()), closed: false, open: '06:00', close: '22:00' }],
          exceptions: [],
          override: { mode: 'none', until: '' },
        },
        readyPacks: 12,
      }
    }
  }, [stationId, type])

  const durations = useMemo(() => {
    const raw = station.bookingRules?.allowedDurations || [10, 20, 30]
    return Array.from(new Set(raw.filter((n: number) => Number.isInteger(n) && n > 0 && n <= 120)))
      .sort((a: number, b: number) => a - b)
      .slice(0, 9) as number[]
  }, [station])

  const eff = computeOpenNow(station.availability)

  // Set default connector/pack
  useEffect(() => {
    if (type === 'charge' && station.connectors && !connectorId) {
      setConnectorId(station.connectors[0]?.id || '')
    }
    if (type === 'swap' && station.packs && !packId) {
      setPackId(station.packs[0]?.id || '')
    }
  }, [type, station, connectorId, packId])

  function toast(m: string) {
    setAck(m)
    setTimeout(() => setAck(''), 1500)
  }

  function reserve() {
    if (!date || !startTime || !duration) return toast('Fill all required fields')
    if (type === 'charge' && !connectorId) return toast('Select a connector')
    if (type === 'swap' && !packId) return toast('Select a pack type')

    const payload = {
      kind: type,
      stationId: station.id,
      ...(type === 'charge' ? { connectorId } : { packId, lockerId: lockerId === 'auto' ? null : lockerId }),
      start: `${date}T${startTime}:00`,
      durationMin: duration,
      graceMin: station.bookingRules.gracePeriodMin,
      createdAt: new Date().toISOString(),
      actor: 'operator',
    }

    console.log(`CREATE_${type.toUpperCase()}_BOOKING`, payload)
    toast(`Reserved ${duration} min on ${date} at ${startTime}`)
  }

  if (!perms.create) {
    return (
      <DashboardLayout pageTitle="Manual Reserve">
        <Card>
          <p className="text-muted">You don't have permission to create reservations.</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={`Manual Reserve — ${type === 'charge' ? 'Charging' : 'Swap'}`}>
      {ack && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{ack}</div>}

      {/* Station info */}
      <Card className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <div className="inline-flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                eff.open ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {eff.open ? 'Open now' : 'Closed'}
            </span>
            {type === 'swap' && 'readyPacks' in station && (
              <span className="text-muted">
                Ready packs: <b>{station.readyPacks}</b>
              </span>
            )}
          </div>
          <div className="text-muted">
            {type === 'charge'
              ? `Connectors: ${station.connectors?.map((c) => `${c.type} ${c.kw}kW`).join(', ')}`
              : `Pack types: ${station.packs?.map((p) => p.label).join(', ')}`}
          </div>
        </div>
      </Card>

      {/* Reservation form */}
      <Card>
        <h3 className="font-semibold mb-3">
          Reserve a {type === 'charge' ? 'charging slot' : 'swap'}
        </h3>
        <div className={`grid gap-3 ${type === 'charge' ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} items-end`}>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border border-border px-2 py-1"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Start time</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded border border-border px-2 py-1"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Duration</span>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
              className="rounded border border-border px-2 py-1"
            >
              {durations.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </label>
          {type === 'charge' ? (
            <label className="grid gap-1 text-sm">
              <span className="text-muted">Connector</span>
              <select
                value={connectorId}
                onChange={(e) => setConnectorId(e.target.value)}
                className="rounded border border-border px-2 py-1"
              >
                {station.connectors?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type} • {c.kw} kW
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="grid gap-1 text-sm">
                <span className="text-muted">Pack type</span>
                <select
                  value={packId}
                  onChange={(e) => setPackId(e.target.value)}
                  className="rounded border border-border px-2 py-1"
                >
                  {station.packs?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted">Locker/Bay (optional)</span>
                <select
                  value={lockerId}
                  onChange={(e) => setLockerId(e.target.value)}
                  className="rounded border border-border px-2 py-1"
                >
                  <option value="auto">Auto-assign</option>
                  {station.lockers?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
        <div className="pt-4">
          <button className="btn primary" onClick={reserve}>
            Reserve a {type === 'charge' ? 'slot' : 'swap'}
          </button>
        </div>
        <p className="text-xs text-muted mt-2">
          Booking fee is non‑refundable.{' '}
          {type === 'charge'
            ? 'Energy is billed per tariff during/after the session.'
            : 'Energy is settled at the kiosk after your scan.'}
        </p>
      </Card>
    </DashboardLayout>
  )
}

