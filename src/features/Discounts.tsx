import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Discounts & Promotions — Owner discount management
   RBAC: Owners, Platform admins
───────────────────────────────────────────────────────────────────────────── */

type DiscountType = 'Promo code' | 'Automatic' | 'Partnership'
type DiscountStatus = 'Active' | 'Scheduled' | 'Expired' | 'Draft'

interface Discount {
  id: string
  name: string
  kind: DiscountType
  value: string
  from: string
  to: string
  sites: string[]
  used: number
  status: DiscountStatus
}

const MOCK_DISCOUNTS: Discount[] = [
  { id: 'ds-501', name: 'WELCOME10', kind: 'Promo code', value: '10% off', from: '2025-10-01', to: '2025-12-31', sites: ['All'], used: 128, status: 'Active' },
  { id: 'ds-502', name: 'Fleet Partner A', kind: 'Partnership', value: '$0.05/kWh off', from: '2025-09-01', to: '2026-09-01', sites: ['Central Hub', 'East Parkade'], used: 412, status: 'Active' },
  { id: 'ds-503', name: 'Weekend Saver', kind: 'Automatic', value: '$0.07/kWh off', from: '2025-11-01', to: '2025-12-01', sites: ['Warehouse Lot'], used: 0, status: 'Scheduled' },
  { id: 'ds-504', name: 'Spring Blitz', kind: 'Automatic', value: '15% off', from: '2025-03-01', to: '2025-04-01', sites: ['Central Hub'], used: 920, status: 'Expired' },
  { id: 'ds-505', name: 'HOLIDAY20', kind: 'Promo code', value: '20% off', from: '2025-12-20', to: '2026-01-05', sites: ['All'], used: 0, status: 'Draft' },
]

export function Discounts() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'OWNER'
  const canView = hasPermission(role, 'tariffs', 'view')
  const canEdit = hasPermission(role, 'tariffs', 'edit')

  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [site, setSite] = useState('All')
  const [currency, setCurrency] = useState('USD')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const filtered = useMemo(() =>
    MOCK_DISCOUNTS
      .filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()))
      .filter(r => type === 'All' || r.kind === type)
      .filter(r => status === 'All' || r.status === status)
      .filter(r => site === 'All' || r.sites.includes(site) || r.sites.includes('All'))
  , [q, type, status, site])

  const kpis = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter(d => d.status === 'Active').length,
    totalRedemptions: filtered.reduce((sum, d) => sum + d.used, 0),
    scheduled: filtered.filter(d => d.status === 'Scheduled').length,
  }), [filtered])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Discounts.</div>
  }

  return (
    <div className="space-y-6">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">Total Discounts</div>
          <div className="mt-2 text-2xl font-bold">{kpis.total}</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">Active</div>
          <div className="mt-2 text-2xl font-bold">{kpis.active}</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">Total Redemptions</div>
          <div className="mt-2 text-2xl font-bold">{kpis.totalRedemptions.toLocaleString()}</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">Scheduled</div>
          <div className="mt-2 text-2xl font-bold">{kpis.scheduled}</div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-6 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search discounts" className="input pl-9" />
        </label>
        <select value={type} onChange={e => setType(e.target.value)} className="select">
          {['All', 'Promo code', 'Automatic', 'Partnership'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={site} onChange={e => setSite(e.target.value)} className="select">
          {['All', 'Central Hub', 'East Parkade', 'Warehouse Lot'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={currency} onChange={e => setCurrency(e.target.value)} className="select">
          {['USD', 'EUR', 'UGX', 'KES', 'CNY'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="select">
          {['All', 'Active', 'Scheduled', 'Expired', 'Draft'].map(o => <option key={o}>{o}</option>)}
        </select>
      </section>

      {/* Actions */}
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => toast('Create Discount modal would open')} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            New Discount
          </button>
        </div>
      )}

      {/* Table */}
      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-subtle">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Value</th>
              <th className="px-4 py-3 text-left font-medium">Validity</th>
              <th className="px-4 py-3 text-left font-medium">Sites</th>
              <th className="px-4 py-3 text-right font-medium">Redemptions</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              {canEdit && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3"><TypePill type={r.kind} /></td>
                <td className="px-4 py-3">{r.value}</td>
                <td className="px-4 py-3 text-subtle">{r.from} → {r.to}</td>
                <td className="px-4 py-3 text-subtle">{r.sites.join(', ')}</td>
                <td className="px-4 py-3 text-right">{r.used.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                {canEdit && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => toast(`View ${r.name}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">View</button>
                      <button onClick={() => toast(`Edit ${r.name}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Edit</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-subtle">No discounts match your filters.</div>}
      </section>
    </div>
  )
}

function TypePill({ type }: { type: DiscountType }) {
  const colors: Record<DiscountType, string> = {
    'Promo code': 'bg-blue-100 text-blue-700',
    'Automatic': 'bg-emerald-100 text-emerald-700',
    'Partnership': 'bg-amber-100 text-amber-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[type]}`}>{type}</span>
}

function StatusPill({ status }: { status: DiscountStatus }) {
  const colors: Record<DiscountStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Scheduled: 'bg-blue-100 text-blue-700',
    Expired: 'bg-gray-100 text-gray-600',
    Draft: 'bg-amber-100 text-amber-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default Discounts

