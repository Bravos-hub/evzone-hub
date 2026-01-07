import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Operators — Owner's operator management
   RBAC: Owners, Platform admins
───────────────────────────────────────────────────────────────────────────── */

type OperatorStatus = 'Active' | 'Suspended' | 'Invited'
type SLATier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'

interface Operator {
  id: string
  name: string
  sites: number
  sla: SLATier
  noc: string
  response: string
  tickets: number
  uptime: string
  status: OperatorStatus
  regions: string[]
}

const MOCK_OPERATORS: Operator[] = [
  { id: 'op-101', name: 'VoltOps', sites: 12, sla: 'Gold', noc: '24/7', response: '4h', tickets: 8, uptime: '99.7%', status: 'Active', regions: ['Africa', 'Europe'] },
  { id: 'op-102', name: 'GridManaged', sites: 7, sla: 'Silver', noc: 'Business', response: '8h', tickets: 3, uptime: '99.1%', status: 'Active', regions: ['Africa', 'Asia'] },
  { id: 'op-103', name: 'ChargePilot', sites: 4, sla: 'Platinum', noc: '24/7', response: '2h', tickets: 1, uptime: '99.9%', status: 'Invited', regions: ['Americas', 'Europe'] },
  { id: 'op-104', name: 'AmpCrew Ops', sites: 5, sla: 'Bronze', noc: 'Business', response: 'Next-day', tickets: 12, uptime: '98.2%', status: 'Suspended', regions: ['Africa'] },
]

export function Operators() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'OWNER'
  const canView = hasPermission(role, 'team', 'view')
  const canManage = hasPermission(role, 'team', 'edit')

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [sla, setSla] = useState('All')
  const [region, setRegion] = useState('All')
  const [operators, setOperators] = useState(MOCK_OPERATORS)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const filtered = useMemo(() =>
    operators
      .filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()))
      .filter(r => status === 'All' || r.status === status)
      .filter(r => sla === 'All' || r.sla === sla)
      .filter(r => region === 'All' || r.regions.includes(region))
  , [operators, q, status, sla, region])

  const toggle = (op: Operator) => {
    const newStatus = op.status === 'Active' ? 'Suspended' : 'Active'
    setOperators(list => list.map(o => o.id === op.id ? { ...o, status: newStatus } : o))
    toast(`${newStatus === 'Active' ? 'Resumed' : 'Suspended'} ${op.name}`)
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Operators.</div>
  }

  return (
    <div className="space-y-6">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Operators', value: filtered.length },
          { label: 'Active', value: filtered.filter(o => o.status === 'Active').length },
          { label: 'Total Sites', value: filtered.reduce((sum, o) => sum + o.sites, 0) },
          { label: 'Avg Uptime', value: filtered.length > 0 ? (filtered.reduce((sum, o) => sum + parseFloat(o.uptime), 0) / filtered.length).toFixed(1) + '%' : '—' },
        ].map(k => (
          <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-5 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search operators" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['All', 'Active', 'Suspended', 'Invited'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={sla} onChange={e => setSla(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['All', 'Bronze', 'Silver', 'Gold', 'Platinum'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={region} onChange={e => setRegion(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['All', 'Africa', 'Europe', 'Asia', 'Americas'].map(o => <option key={o}>{o}</option>)}
        </select>
      </section>

      {/* Actions */}
      {canManage && (
        <div className="flex justify-end">
          <button onClick={() => toast('Invite Operator modal would open')} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">
            Invite Operator
          </button>
        </div>
      )}

      {/* Table */}
      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-subtle">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Operator</th>
              <th className="px-4 py-3 text-left font-medium">Sites</th>
              <th className="px-4 py-3 text-left font-medium">SLA</th>
              <th className="px-4 py-3 text-left font-medium">NOC Hours</th>
              <th className="px-4 py-3 text-left font-medium">Response</th>
              <th className="px-4 py-3 text-left font-medium">Open Tickets</th>
              <th className="px-4 py-3 text-left font-medium">Uptime</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{r.sites}</td>
                <td className="px-4 py-3"><SLAPill sla={r.sla} /></td>
                <td className="px-4 py-3">{r.noc}</td>
                <td className="px-4 py-3">{r.response}</td>
                <td className="px-4 py-3">{r.tickets}</td>
                <td className="px-4 py-3 font-medium">{r.uptime}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                {canManage && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => toast(`View report for ${r.name}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Report</button>
                      {r.status === 'Active' && (
                        <button onClick={() => toggle(r)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 5h3v14H8zM13 5h3v14h-3z" /></svg>
                          Suspend
                        </button>
                      )}
                      {r.status === 'Suspended' && (
                        <button onClick={() => toggle(r)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          Resume
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-subtle">No operators match your filters.</div>}
      </section>
    </div>
  )
}

function SLAPill({ sla }: { sla: SLATier }) {
  const colors: Record<SLATier, string> = {
    Bronze: 'bg-amber-100 text-amber-700',
    Silver: 'bg-gray-100 text-gray-600',
    Gold: 'bg-yellow-100 text-yellow-700',
    Platinum: 'bg-purple-100 text-purple-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[sla]}`}>{sla}</span>
}

function StatusPill({ status }: { status: OperatorStatus }) {
  const colors: Record<OperatorStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Suspended: 'bg-rose-100 text-rose-700',
    Invited: 'bg-blue-100 text-blue-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default Operators

