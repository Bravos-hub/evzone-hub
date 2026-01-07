import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & ICONS
// ═══════════════════════════════════════════════════════════════════════════

type QueueItem = {
  ticket: string
  vehicle: string
  requested: string
  priority: number
  eta: string
}

type Battery = {
  id: string
  type: string
  soc: number
  health: number
  status: string
  loc: string
}

type HealthMetric = {
  k: string
  v: string
}

type SwapSession = {
  id: string
  in: string
  out: string
  start: string
  end: string
  fee: number
  st: string
}

const IconBolt = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>
)

const IconBattery = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="18" height="10" rx="2" />
    <path d="M22 11v2" />
  </svg>
)

const IconClock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

const IconPlay = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const IconPause = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
  </svg>
)

const IconShield = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 4v6a8 8 0 0 1-7 8 8 8 0 0 1-7-8V7z" />
  </svg>
)

const IconTools = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3l3 3-9.4 9.4H5.3v-3.99z" />
    <path d="M12 2l1.5 1.5" />
  </svg>
)

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Operator Swap Station Detail - Operator feature
 * Shows station details with tabs: Overview, Queue, Inventory, Health, Sessions
 */
export function OperatorSwapStationDetail() {
  const { id } = useParams<{ id: string }>()
  const stationId = id || 'SS-701'
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'stations')

  const [tab, setTab] = useState('Overview')
  const [ack, setAck] = useState('')
  const [paused, setPaused] = useState(false)
  const [closedBays, setClosedBays] = useState(0)
  const [safety, setSafety] = useState(false)

  const station = {
    id: stationId,
    site: 'Central Hub',
    city: 'Kampala',
    status: 'Online' as const,
    proto: 'BSS',
    bat: 'LFP',
    bays: { used: 10, total: 12 },
    in: 46,
    out: 44,
    swaps24: 128,
    seen: '11:42',
  }

  const [queue, setQueue] = useState<QueueItem[]>([
    { ticket: 'Q-1041', vehicle: 'EV-UG-55A', requested: 'LFP 48V', priority: 2, eta: '~3m' },
    { ticket: 'Q-1040', vehicle: 'EV-UG-88Z', requested: 'LFP 48V', priority: 1, eta: '~1m' },
  ])

  const inventory: Battery[] = [
    { id: 'BAT-7001', type: 'LFP 48V', soc: 92, health: 98, status: 'Available', loc: 'Bay 2' },
    { id: 'BAT-7002', type: 'LFP 48V', soc: 54, health: 96, status: 'Charging', loc: 'Chg 1' },
    { id: 'BAT-7090', type: 'LFP 48V', soc: 14, health: 90, status: 'Maintenance', loc: 'Svc' },
  ]

  const health: HealthMetric[] = [
    { k: 'Uptime (7d)', v: '99.4%' },
    { k: 'Avg swap time', v: '6m 20s' },
    { k: 'Safety events (7d)', v: '1' },
  ]

  const sessions: SwapSession[] = [
    { id: 'SWP-9010', in: 'BAT-7001', out: 'BAT-7100', start: '11:05', end: '11:14', fee: 2.5, st: 'Completed' },
  ]

  function toast(m: string) {
    setAck(m)
    setTimeout(() => setAck(''), 1500)
  }

  function callNext() {
    if (!queue.length) return toast('Queue empty')
    const [n, ...rest] = queue
    setQueue(rest)
    toast(`Calling ${n.ticket} — demo`)
  }

  if (!perms.view) {
    return (
      <DashboardLayout pageTitle="Swap Station Detail">
        <Card>
          <p className="text-muted">You don't have permission to view this page.</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={`Swap Station — ${station.id}`}>
      {/* Status bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              station.status === 'Online' ? 'bg-accent/10 text-accent' : 'bg-red-100 text-red-700'
            }`}
          >
            {station.status}
          </span>
          <span className="text-muted">
            {station.site} • {station.city} • {station.proto} • {station.bat}
          </span>
        </div>
        <Link to="/swap-stations" className="btn secondary">
          Back to Stations
        </Link>
      </div>

      {/* Command bar */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn secondary"
            onClick={() => {
              setPaused((v) => !v)
              toast(paused ? 'Resumed station' : 'Paused station')
            }}
          >
            {paused ? <IconPlay /> : <IconPause />} {paused ? 'Resume' : 'Pause'} station
          </button>
          <label className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border bg-surface">
            Close bays
            <input
              type="number"
              min="0"
              max={station.bays.total}
              value={closedBays}
              onChange={(e) => setClosedBays(Math.max(0, Math.min(station.bays.total, Number(e.target.value) || 0)))}
              className="w-16 rounded border border-border px-2 py-1"
              disabled={!perms.edit}
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border bg-surface">
            <input
              type="checkbox"
              checked={safety}
              onChange={(e) => {
                setSafety(e.target.checked)
                toast(e.target.checked ? 'Safety lock ON' : 'Safety lock OFF')
              }}
              className="rounded border-border"
              disabled={!perms.edit}
            />
            <span className="inline-flex items-center gap-1">
              Safety lock <IconShield />
            </span>
          </label>
          {ack && <div className="ml-auto text-xs text-muted" role="status" aria-live="polite">{ack}</div>}
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <ul className="flex items-center gap-2 overflow-x-auto">
          {['Overview', 'Queue', 'Inventory', 'Health', 'Sessions'].map((t) => (
            <li key={t}>
              <button
                onClick={() => setTab(t)}
                className={`px-4 py-2 border-b-2 ${
                  tab === t ? 'border-accent text-text' : 'border-transparent text-muted'
                } hover:text-text`}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Bays used / total" value={`${station.bays.used - closedBays}/${station.bays.total}`} icon={<IconBattery />} />
          <KpiCard label="Batteries (in/out)" value={`${station.in}/${station.out}`} />
          <KpiCard label="Swaps (24h)" value={`${station.swaps24}`} />
          <KpiCard label="Last seen" value={station.seen} icon={<IconClock />} />
        </div>
      )}

      {tab === 'Queue' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Queue</h3>
            <button className="btn primary" onClick={callNext}>
              <IconPlay /> Call next
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt text-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Ticket</th>
                  <th className="px-4 py-2 text-left">Vehicle</th>
                  <th className="px-4 py-2 text-left">Requested</th>
                  <th className="px-4 py-2 text-left">Priority</th>
                  <th className="px-4 py-2 text-left">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {queue.map((q) => (
                  <tr key={q.ticket} className="hover:bg-surface-alt">
                    <td className="px-4 py-2 font-medium">{q.ticket}</td>
                    <td className="px-4 py-2">{q.vehicle}</td>
                    <td className="px-4 py-2">{q.requested}</td>
                    <td className="px-4 py-2">{q.priority}</td>
                    <td className="px-4 py-2">{q.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'Inventory' && (
        <Card>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt text-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Battery</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">SoC</th>
                  <th className="px-4 py-2 text-left">Health</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-alt">
                    <td className="px-4 py-2 font-medium">{b.id}</td>
                    <td className="px-4 py-2">{b.type}</td>
                    <td className="px-4 py-2">{b.soc}%</td>
                    <td className="px-4 py-2">{b.health}%</td>
                    <td className="px-4 py-2">{b.status}</td>
                    <td className="px-4 py-2">{b.loc}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button className="btn secondary text-xs">Mark out</button>
                        <button className="btn secondary text-xs inline-flex items-center gap-1">
                          <IconTools /> Maintain
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'Health' && (
        <div className="grid gap-3 sm:grid-cols-3">
          {health.map((h) => (
            <Card key={h.k}>
              <div className="text-muted mb-1">{h.k}</div>
              <div className="text-text font-semibold">{h.v}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'Sessions' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent swaps</h3>
            <Link to={`/sessions?station=${station.id}`} className="text-sm text-accent hover:underline">
              Open all swaps
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt text-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Swap</th>
                  <th className="px-4 py-2 text-left">In</th>
                  <th className="px-4 py-2 text-left">Out</th>
                  <th className="px-4 py-2 text-left">Start</th>
                  <th className="px-4 py-2 text-left">End</th>
                  <th className="px-4 py-2 text-right">Fee</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-alt">
                    <td className="px-4 py-2 font-medium">
                      <Link to={`/sessions/${s.id}`} className="text-accent hover:underline">
                        {s.id}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{s.in}</td>
                    <td className="px-4 py-2">{s.out}</td>
                    <td className="px-4 py-2">{s.start}</td>
                    <td className="px-4 py-2">{s.end}</td>
                    <td className="px-4 py-2 text-right">${s.fee.toFixed(2)}</td>
                    <td className="px-4 py-2">{s.st}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  )
}

function KpiCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <div className="text-sm text-muted flex items-center gap-2 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-text">{value}</div>
    </Card>
  )
}

