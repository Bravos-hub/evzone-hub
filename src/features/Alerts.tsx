import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { getErrorMessage } from '@/core/api/errors'
import type { NotificationItem } from '@/core/api/types'

/* ─────────────────────────────────────────────────────────────────────────────
   Platform Alerts — System alerts monitoring and management
   RBAC: Platform admins and operators
───────────────────────────────────────────────────────────────────────────── */

type Severity = 'High' | 'Medium' | 'Low' | 'Info'
type AlertStatus = 'New' | 'Acknowledged' | 'Resolved'
type Source = 'OCPP' | 'OCPI' | 'Billing' | 'MQTT' | 'Auth' | 'Other'
type Area = 'Backend' | 'Frontend' | 'Partner' | 'Other'

interface Alert {
  id: string
  sev: Severity
  src: Source
  area: Area
  msg: string
  ts: string
  createdAtMs: number
  status: AlertStatus
}

const mapSeverity = (item: NotificationItem): Severity => {
  const metaSev = item.metadata?.severity?.toLowerCase()
  if (metaSev === 'high' || metaSev === 'critical') return 'High'
  if (metaSev === 'medium') return 'Medium'
  if (metaSev === 'low') return 'Low'
  if (metaSev === 'info') return 'Info'
  switch (item.kind) {
    case 'alert':
      return 'High'
    case 'warning':
      return 'Medium'
    case 'info':
    case 'notice':
      return 'Info'
    case 'system':
      return 'Low'
    default:
      return 'Low'
  }
}

const mapSource = (item: NotificationItem): Source => {
  const src = (item.source || '').toUpperCase()
  if (['OCPP', 'OCPI', 'BILLING', 'MQTT', 'AUTH'].includes(src)) return src as Source
  return 'Other'
}

const mapArea = (item: NotificationItem): Area => {
  const area = (item.metadata?.area || '').toLowerCase()
  if (area.includes('front')) return 'Frontend'
  if (area.includes('partner')) return 'Partner'
  if (area.includes('back')) return 'Backend'
  return 'Other'
}

const mapStatus = (item: NotificationItem): AlertStatus => {
  if (item.metadata?.status === 'resolved') return 'Resolved'
  if (item.read) return 'Acknowledged'
  return 'New'
}

const mapAlert = (item: NotificationItem): Alert => {
  const created = new Date(item.createdAt)
  const createdAtMs = Number.isFinite(created.getTime()) ? created.getTime() : Date.now()
  return {
    id: item.id,
    sev: mapSeverity(item),
    src: mapSource(item),
    area: mapArea(item),
    msg: item.message || item.title,
    ts: Number.isFinite(created.getTime()) ? created.toLocaleString() : item.createdAt,
    createdAtMs,
    status: mapStatus(item),
  }
}

export function Alerts() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'incidents', 'view')
  const canManage = hasPermission(role, 'incidents', 'resolve')

  const [sev, setSev] = useState('All')
  const [src, setSrc] = useState('All')
  const [area, setArea] = useState('All')
  const [status, setStatus] = useState('All')
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('2025-10-01')
  const [to, setTo] = useState('2025-10-31')
  const { data: notifications = [], isLoading, error } = useNotifications()
  const [overrides, setOverrides] = useState<Record<string, AlertStatus>>({})
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const baseAlerts = useMemo(() => notifications.map(mapAlert), [notifications])

  const alerts = useMemo(() => {
    return baseAlerts.map((alert) => ({
      ...alert,
      status: overrides[alert.id] ?? alert.status,
    }))
  }, [baseAlerts, overrides])

  const filtered = useMemo(() =>
    alerts
      .filter(a => !q || (a.msg + ' ' + a.id).toLowerCase().includes(q.toLowerCase()))
      .filter(a => sev === 'All' || a.sev === sev)
      .filter(a => src === 'All' || a.src === src)
      .filter(a => area === 'All' || a.area === area)
      .filter(a => status === 'All' || a.status === status)
      .filter(a => {
        if (!from || !to) return true
        const fromMs = new Date(from).getTime()
        const toMs = new Date(`${to}T23:59:59`).getTime()
        return a.createdAtMs >= fromMs && a.createdAtMs <= toMs
      })
  , [alerts, q, sev, src, area, status, from, to])

  const sourceOptions = useMemo(() => ['All', ...Array.from(new Set(alerts.map(a => a.src)))], [alerts])
  const areaOptions = useMemo(() => ['All', ...Array.from(new Set(alerts.map(a => a.area)))], [alerts])

  const acknowledge = (id: string) => {
    setOverrides((prev) => ({ ...prev, [id]: 'Acknowledged' }))
    toast(`Acknowledged ${id}`)
  }

  const resolve = (id: string) => {
    setOverrides((prev) => ({ ...prev, [id]: 'Resolved' }))
    toast(`Resolved ${id}`)
  }

  const escalate = (id: string) => {
    toast(`Escalated ${id} to on-call team`)
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Platform Alerts.</div>
  }

  return (
    <DashboardLayout pageTitle="Platform Alerts">
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {getErrorMessage(error)}
        </div>
      )}
      <div className="space-y-6">
        {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

        {/* Filters */}
        <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-8 gap-3">
          <label className="relative md:col-span-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search alerts" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
          </label>
        <select value={sev} onChange={e => setSev(e.target.value)} className="select">
          {['All', 'High', 'Medium', 'Low', 'Info'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={src} onChange={e => setSrc(e.target.value)} className="select">
          {sourceOptions.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={area} onChange={e => setArea(e.target.value)} className="select">
          {areaOptions.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="select">
          {['All', 'New', 'Acknowledged', 'Resolved'].map(o => <option key={o}>{o}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input" />
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Alerts', value: filtered.length },
            { label: 'New', value: filtered.filter(a => a.status === 'New').length },
            { label: 'Acknowledged', value: filtered.filter(a => a.status === 'Acknowledged').length },
            { label: 'High Severity', value: filtered.filter(a => a.sev === 'High').length },
          ].map(k => (
            <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
              <div className="text-sm text-subtle">{k.label}</div>
              <div className="mt-2 text-2xl font-bold">{k.value}</div>
            </div>
          ))}
        </section>

        {/* Table */}
        <section className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
              <tr>
                <th className="w-24 px-4 py-3 text-left font-medium">ID</th>
                <th className="w-24 px-4 py-3 text-left font-medium">Severity</th>
                <th className="w-24 px-4 py-3 text-left font-medium">Source</th>
                <th className="w-24 px-4 py-3 text-left font-medium">Area</th>
                <th className="w-64 px-4 py-3 text-left font-medium">Message</th>
                <th className="w-32 px-4 py-3 text-left font-medium">Time</th>
                <th className="w-24 px-4 py-3 text-left font-medium">Status</th>
                {canManage && <th className="w-24 px-4 py-3 !text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-muted/50 text-xs">
                  <td className="px-4 py-3 font-medium truncate max-w-[80px]" title={a.id}>{a.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><SeverityPill sev={a.sev} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">{a.src}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{a.area}</td>
                  <td className="px-4 py-3 text-subtle truncate max-w-[200px]" title={a.msg}>{a.msg}</td>
                  <td className="px-4 py-3 text-subtle whitespace-nowrap">{a.ts}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusPill status={a.status} /></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {a.status !== 'Acknowledged' && a.status !== 'Resolved' && (
                          <button onClick={() => acknowledge(a.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Ack</button>
                        )}
                        {a.status !== 'Resolved' && (
                          <button onClick={() => resolve(a.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Resolve</button>
                        )}
                        <button onClick={() => escalate(a.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Escalate</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <div className="p-8 text-center text-subtle">Loading alerts...</div>}
          {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No alerts match your filters.</div>}
        </section>
      </div>
    </DashboardLayout>
  )
}

function SeverityPill({ sev }: { sev: Severity }) {
  const colors: Record<Severity, string> = {
    High: 'bg-rose-100 text-rose-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-sky-100 text-sky-700',
    Info: 'bg-gray-100 text-gray-600',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[sev]}`}>{sev}</span>
}

function StatusPill({ status }: { status: AlertStatus }) {
  const colors: Record<AlertStatus, string> = {
    New: 'bg-rose-100 text-rose-700',
    Acknowledged: 'bg-amber-100 text-amber-700',
    Resolved: 'bg-emerald-100 text-emerald-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default Alerts

