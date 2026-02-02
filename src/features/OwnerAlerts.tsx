import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { getErrorMessage } from '@/core/api/errors'
import type { NotificationItem } from '@/core/api/types'

/* ─────────────────────────────────────────────────────────────────────────────
   Owner Alerts — Station/site alerting for Owners
   RBAC: Owners, Station Admins, Managers
───────────────────────────────────────────────────────────────────────────── */

type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Info'
type AlertStatus = 'Open' | 'Ack' | 'Resolved'

interface OwnerAlert {
  id: string
  sev: AlertSeverity
  type: string
  site: string
  device: string
  since: string
  status: AlertStatus
  createdAtMs: number
}

const mapSeverity = (item: NotificationItem): AlertSeverity => {
  const metaSev = item.metadata?.severity?.toLowerCase()
  if (metaSev === 'critical') return 'Critical'
  if (metaSev === 'high') return 'High'
  if (metaSev === 'medium') return 'Medium'
  if (metaSev === 'info') return 'Info'
  switch (item.kind) {
    case 'alert':
      return 'High'
    case 'warning':
      return 'Medium'
    case 'info':
    case 'notice':
      return 'Info'
    default:
      return 'Medium'
  }
}

const mapStatus = (item: NotificationItem): AlertStatus => {
  if (item.metadata?.status === 'resolved') return 'Resolved'
  if (item.read) return 'Ack'
  return 'Open'
}

const mapOwnerAlert = (item: NotificationItem): OwnerAlert => {
  const created = new Date(item.createdAt)
  const createdAtMs = Number.isFinite(created.getTime()) ? created.getTime() : Date.now()
  const site = item.metadata?.site || item.metadata?.station || item.metadata?.stationName || '—'
  const device = item.metadata?.device || item.metadata?.charger || item.metadata?.chargePoint || '—'
  return {
    id: item.id,
    sev: mapSeverity(item),
    type: item.metadata?.type || item.title || item.kind,
    site,
    device,
    since: Number.isFinite(created.getTime()) ? created.toLocaleTimeString() : '—',
    status: mapStatus(item),
    createdAtMs,
  }
}

export function OwnerAlerts() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'STATION_OWNER'
  const canView = hasPermission(role, 'incidents', 'view')
  const canManage = hasPermission(role, 'incidents', 'resolve')

  const [q, setQ] = useState('')
  const [site, setSite] = useState('All')
  const [sev, setSev] = useState('All')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('Open')
  const { data: notifications = [], isLoading, error } = useNotifications()
  const [overrides, setOverrides] = useState<Record<string, AlertStatus>>({})
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const baseAlerts = useMemo(() => notifications.map(mapOwnerAlert), [notifications])

  const alerts = useMemo(() => {
    return baseAlerts.map((alert) => ({
      ...alert,
      status: overrides[alert.id] ?? alert.status,
    }))
  }, [baseAlerts, overrides])

  const filtered = useMemo(() =>
    alerts
      .filter(a => site === 'All' || a.site === site)
      .filter(a => sev === 'All' || a.sev === sev)
      .filter(a => type === 'All' || a.type === type)
      .filter(a => status === 'All' || (status === 'Open' ? a.status !== 'Resolved' : a.status === status))
      .filter(a => !q || a.site.toLowerCase().includes(q.toLowerCase()) || a.type.toLowerCase().includes(q.toLowerCase()))
  , [alerts, q, site, sev, type, status])

  const siteOptions = useMemo(() => ['All', ...Array.from(new Set(alerts.map(a => a.site).filter(Boolean)))], [alerts])
  const typeOptions = useMemo(() => ['All', ...Array.from(new Set(alerts.map(a => a.type).filter(Boolean)))], [alerts])

  const acknowledge = (id: string) => {
    setOverrides((prev) => ({ ...prev, [id]: 'Ack' }))
    toast(`Acknowledged alert ${id}`)
  }

  const resolve = (id: string) => {
    setOverrides((prev) => ({ ...prev, [id]: 'Resolved' }))
    toast(`Resolved alert ${id}`)
  }

  const assign = (id: string) => {
    toast(`Assign alert ${id} modal would open`)
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Owner Alerts.</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {getErrorMessage(error)}
        </div>
      )}
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Alerts', value: filtered.length },
          { label: 'Open', value: filtered.filter(a => a.status === 'Open').length },
          { label: 'Critical', value: filtered.filter(a => a.sev === 'Critical').length },
          { label: 'High Priority', value: filtered.filter(a => a.sev === 'High').length },
        ].map(k => (
          <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4">
        <div className="grid md:grid-cols-5 gap-3">
          <select value={site} onChange={e => setSite(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
            {siteOptions.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={sev} onChange={e => setSev(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
            {['All', 'Critical', 'High', 'Medium', 'Info'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
            {typeOptions.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
            {['Open', 'Ack', 'Resolved', 'All'].map(o => <option key={o}>{o}</option>)}
          </select>
          <label className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search (site or type)" className="w-full rounded-lg border border-border px-3 py-2 pl-9 outline-none focus:ring-2 focus:ring-accent" />
          </label>
        </div>
      </section>

      {/* Alerts List */}
      <section className="bg-surface rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Alerts</h2>
          <div className="text-sm text-subtle">Total: {filtered.length}</div>
        </div>
        <ul className="divide-y divide-border">
          {isLoading && (
            <li className="py-6 text-center text-subtle">Loading alerts...</li>
          )}
          {filtered.map(a => (
            <li key={a.id} className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityPill sev={a.sev} />
                  <span className="font-medium">{a.type}</span>
                  <span className="text-subtle">• {a.site}</span>
                  <span className="text-subtle">• {a.device}</span>
                </div>
                <div className="text-xs text-subtle">Since {a.since} • Status: {a.status}</div>
              </div>
              {canManage && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.status === 'Open' && (
                    <button onClick={() => acknowledge(a.id)} className="px-3 py-1.5 rounded border border-border hover:bg-muted text-sm">
                      Acknowledge
                    </button>
                  )}
                  {a.status !== 'Resolved' && (
                    <button onClick={() => resolve(a.id)} className="px-3 py-1.5 rounded border border-border hover:bg-muted text-sm">
                      Resolve
                    </button>
                  )}
                  <button onClick={() => assign(a.id)} className="px-3 py-1.5 rounded border border-border hover:bg-muted text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12a5 5 0 100-10 5 5 0 000 10z" /><path d="M3 21v-1a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8v1z" /></svg>
                    Assign
                  </button>
                </div>
              )}
            </li>
          ))}
          {!isLoading && filtered.length === 0 && (
            <li className="py-6 text-center text-subtle">No alerts match your filters.</li>
          )}
        </ul>
        {filtered.length === 0 && <div className="p-8 text-center text-subtle">No alerts match your filters.</div>}
      </section>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3">
        <a href="/station-map" className="px-4 py-2 rounded-lg border border-border hover:bg-muted">
          Open Map
        </a>
        <a href="/dashboard" className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">
          Open Dashboard
        </a>
      </div>
    </div>
  )
}

function SeverityPill({ sev }: { sev: AlertSeverity }) {
  const colors: Record<AlertSeverity, string> = {
    Critical: 'bg-rose-100 text-rose-700',
    High: 'bg-orange-100 text-orange-700',
    Medium: 'bg-amber-100 text-amber-700',
    Info: 'bg-gray-100 text-gray-600',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[sev]}`}>{sev}</span>
}

export default OwnerAlerts


