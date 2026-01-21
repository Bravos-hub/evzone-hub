import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Platform Alerts — System alerts monitoring and management
   RBAC: Platform admins and operators
───────────────────────────────────────────────────────────────────────────── */

type Severity = 'High' | 'Medium' | 'Low' | 'Info'
type AlertStatus = 'New' | 'Acknowledged' | 'Resolved'
type Source = 'OCPP' | 'OCPI' | 'Billing' | 'MQTT' | 'Auth'
type Area = 'Backend' | 'Frontend' | 'Partner'

interface Alert {
  id: string
  sev: Severity
  src: Source
  area: Area
  msg: string
  ts: string
  status: AlertStatus
}

const MOCK_ALERTS: Alert[] = [
  { id: 'AL-2203', sev: 'High', src: 'OCPP', area: 'Backend', msg: 'Cluster eu-1 heartbeat failures', ts: '2025-10-29 11:34', status: 'New' },
  { id: 'AL-2202', sev: 'Info', src: 'Billing', area: 'Backend', msg: 'Invoice batch completed', ts: '2025-10-29 10:58', status: 'Resolved' },
  { id: 'AL-2201', sev: 'Medium', src: 'MQTT', area: 'Backend', msg: 'Retained message mismatch', ts: '2025-10-29 10:12', status: 'Acknowledged' },
  { id: 'AL-2200', sev: 'Low', src: 'Auth', area: 'Frontend', msg: 'Unusual login pattern detected', ts: '2025-10-29 09:45', status: 'New' },
  { id: 'AL-2199', sev: 'High', src: 'OCPI', area: 'Partner', msg: 'VoltHub sync timeout', ts: '2025-10-29 08:30', status: 'Acknowledged' },
]

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
  const [alerts, setAlerts] = useState(MOCK_ALERTS)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const filtered = useMemo(() =>
    alerts
      .filter(a => !q || (a.msg + ' ' + a.id).toLowerCase().includes(q.toLowerCase()))
      .filter(a => sev === 'All' || a.sev === sev)
      .filter(a => src === 'All' || a.src === src)
      .filter(a => area === 'All' || a.area === area)
      .filter(a => status === 'All' || a.status === status)
  , [alerts, q, sev, src, area, status])

  const acknowledge = (id: string) => {
    setAlerts(list => list.map(a => a.id === id ? { ...a, status: 'Acknowledged' as AlertStatus } : a))
    toast(`Acknowledged ${id}`)
  }

  const resolve = (id: string) => {
    setAlerts(list => list.map(a => a.id === id ? { ...a, status: 'Resolved' as AlertStatus } : a))
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
          {['All', 'OCPP', 'OCPI', 'Billing', 'MQTT', 'Auth'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={area} onChange={e => setArea(e.target.value)} className="select">
          {['All', 'Backend', 'Frontend', 'Partner'].map(o => <option key={o}>{o}</option>)}
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
          {filtered.length === 0 && <div className="p-8 text-center text-subtle">No alerts match your filters.</div>}
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

