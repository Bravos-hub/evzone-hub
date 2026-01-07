import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Tenants — Site Owner tenant/operator management
   RBAC: Site Owners, Platform admins
───────────────────────────────────────────────────────────────────────────── */

type TenantStatus = 'Active' | 'Pending' | 'Suspended' | 'Terminated'

interface Tenant {
  id: string
  name: string
  type: 'Operator' | 'Owner' | 'Fleet'
  site: string
  model: 'Revenue Share' | 'Fixed Rent' | 'Hybrid'
  terms: string
  startDate: string
  status: TenantStatus
  earnings: number
}

const MOCK_TENANTS: Tenant[] = [
  { id: 'TN-001', name: 'VoltOps Ltd', type: 'Operator', site: 'City Mall Roof', model: 'Revenue Share', terms: '15%', startDate: '2024-06-01', status: 'Active', earnings: 4520 },
  { id: 'TN-002', name: 'GridCity Charging', type: 'Owner', site: 'City Mall Roof', model: 'Fixed Rent', terms: '$500/mo', startDate: '2024-08-15', status: 'Active', earnings: 1500 },
  { id: 'TN-003', name: 'EcoFleet Inc', type: 'Fleet', site: 'Business Park A', model: 'Hybrid', terms: '10% + $200/mo', startDate: '2024-09-01', status: 'Active', earnings: 2800 },
  { id: 'TN-004', name: 'QuickCharge Co', type: 'Operator', site: 'Airport Long-Stay', model: 'Revenue Share', terms: '12%', startDate: '2024-10-01', status: 'Pending', earnings: 0 },
  { id: 'TN-005', name: 'PowerUp Ltd', type: 'Owner', site: 'Business Park A', model: 'Fixed Rent', terms: '$350/mo', startDate: '2024-05-01', status: 'Suspended', earnings: 1750 },
]

export function Tenants() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'SITE_OWNER'
  const canView = hasPermission(role, 'tenants', 'view')
  const canEdit = hasPermission(role, 'tenants', 'edit')

  const [site, setSite] = useState('All')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [q, setQ] = useState('')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const filtered = useMemo(() =>
    MOCK_TENANTS
      .filter(r => site === 'All' || r.site === site)
      .filter(r => type === 'All' || r.type === type)
      .filter(r => status === 'All' || r.status === status)
      .filter(r => !q || (r.id + ' ' + r.name + ' ' + r.site).toLowerCase().includes(q.toLowerCase()))
    , [site, type, status, q])

  const kpis = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter(t => t.status === 'Active').length,
    totalEarnings: filtered.reduce((sum, t) => sum + t.earnings, 0),
    pending: filtered.filter(t => t.status === 'Pending').length,
  }), [filtered])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Tenants.</div>
  }

  return (
    <DashboardLayout pageTitle="Site Owner — Tenants">
      <div className="space-y-6">
        {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

        {/* KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Total Tenants</div>
            <div className="mt-2 text-2xl font-bold">{kpis.total}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Active</div>
            <div className="mt-2 text-2xl font-bold">{kpis.active}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Total Earnings</div>
            <div className="mt-2 text-2xl font-bold">${kpis.totalEarnings.toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Pending Applications</div>
            <div className="mt-2 text-2xl font-bold">{kpis.pending}</div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-5 gap-3">
          <label className="relative md:col-span-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tenant / site" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
          </label>
          <select value={site} onChange={e => setSite(e.target.value)} className="select">
            {['All', 'City Mall Roof', 'Business Park A', 'Airport Long-Stay'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="select">
            {['All', 'Operator', 'Owner', 'Fleet'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="select">
            {['All', 'Active', 'Pending', 'Suspended', 'Terminated'].map(o => <option key={o}>{o}</option>)}
          </select>
        </section>

        {/* Table */}
        <section className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
              <tr>
                <th className="w-24">ID</th>
                <th className="w-32">Tenant</th>
                <th className="w-24">Type</th>
                <th className="w-32">Site</th>
                <th className="w-32">Model</th>
                <th className="w-24">Terms</th>
                <th className="w-24">Start Date</th>
                <th className="w-20 px-4 py-3 !text-right font-medium">Earnings</th>
                <th className="w-24">Status</th>
                {canEdit && <th className="w-24 px-4 py-3 !text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium truncate max-w-[80px]" title={r.id}>{r.id}</td>
                  <td className="px-4 py-3 truncate max-w-[128px]" title={r.name}>{r.name}</td>
                  <td className="px-4 py-3 text-xs"><TypePill type={r.type} /></td>
                  <td className="px-4 py-3 truncate max-w-[128px]" title={r.site}>{r.site}</td>
                  <td className="px-4 py-3 truncate max-w-[128px]" title={r.model}>{r.model}</td>
                  <td className="px-4 py-3 text-subtle text-xs whitespace-nowrap">{r.terms}</td>
                  <td className="px-4 py-3 text-subtle text-xs whitespace-nowrap">{r.startDate}</td>
                  <td className="px-4 py-3 text-right font-medium text-xs whitespace-nowrap">${r.earnings.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => toast(`View details for ${r.name}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">View</button>
                        {r.status === 'Pending' && (
                          <>
                            <button onClick={() => toast(`Approved ${r.name}`)} className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs">Approve</button>
                            <button onClick={() => toast(`Rejected ${r.name}`)} className="px-2 py-1 rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs">Reject</button>
                          </>
                        )}
                        {r.status === 'Active' && (
                          <button onClick={() => toast(`Suspended ${r.name}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Suspend</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-subtle">No tenants match your filters.</div>}
        </section>
      </div>
    </DashboardLayout>
  )
}

function TypePill({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Operator: 'bg-blue-100 text-blue-700',
    Owner: 'bg-emerald-100 text-emerald-700',
    Fleet: 'bg-amber-100 text-amber-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[type] || 'bg-gray-100 text-gray-600'}`}>{type}</span>
}

function StatusPill({ status }: { status: TenantStatus }) {
  const colors: Record<TenantStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    Suspended: 'bg-rose-100 text-rose-700',
    Terminated: 'bg-gray-100 text-gray-600',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default Tenants

