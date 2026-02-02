import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useDiscounts } from '@/modules/finance/payments/useDiscounts'
import { useStations } from '@/modules/stations/hooks/useStations'
import { getErrorMessage } from '@/core/api/errors'

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
  currency?: string
}

const mapStatus = (status?: string): DiscountStatus => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'Active'
    case 'scheduled':
      return 'Scheduled'
    case 'expired':
      return 'Expired'
    case 'draft':
    default:
      return 'Draft'
  }
}

const mapType = (type?: string): DiscountType => {
  switch ((type || '').toLowerCase()) {
    case 'promo':
    case 'promo code':
    case 'code':
      return 'Promo code'
    case 'partnership':
      return 'Partnership'
    case 'automatic':
    default:
      return 'Automatic'
  }
}

const formatValue = (value?: number | string, valueType?: string, currency?: string) => {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'string') return value
  const normalizedCurrency = currency || 'USD'
  const vt = (valueType || '').toLowerCase()
  if (vt === 'percent' || vt === '%') return `${value}% off`
  if (vt === 'kwh') return `${normalizedCurrency === 'USD' ? '$' : ''}${value}/kWh off`
  return `${normalizedCurrency === 'USD' ? '$' : ''}${value} off`
}

export function Discounts() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'STATION_OWNER'
  const canView = hasPermission(role, 'tariffs', 'view')
  const canEdit = hasPermission(role, 'tariffs', 'edit')

  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [site, setSite] = useState('All')
  const [currency, setCurrency] = useState('USD')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const { data: discountsData = [], isLoading, error } = useDiscounts()
  const { data: stationsData } = useStations()

  const stationNameById = useMemo(() => {
    const stations = Array.isArray(stationsData) ? stationsData : (stationsData as any)?.data || []
    return new Map(stations.map((s: any) => [s.id, s.name || s.code || s.id]))
  }, [stationsData])

  const discounts = useMemo<Discount[]>(() => {
    const raw = Array.isArray(discountsData) ? discountsData : (discountsData as any)?.data || []
    return raw.map((d: any) => {
      const rawSites = d.sites || d.stationIds || d.applicableStations || ['All']
      const resolvedSites = rawSites.map((s: string) => stationNameById.get(s) || s)
      return {
        id: d.id,
        name: d.name || d.code || d.title || '—',
        kind: mapType(d.type || d.kind),
        value: formatValue(d.value, d.valueType, d.currency),
        from: d.validFrom || d.startDate || d.from || '—',
        to: d.validTo || d.endDate || d.to || '—',
        sites: resolvedSites,
        used: d.redemptions ?? d.used ?? 0,
        status: mapStatus(d.status),
        currency: d.currency || 'USD',
      }
    })
  }, [discountsData, stationNameById])

  const filtered = useMemo(() =>
    discounts
      .filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()))
      .filter(r => type === 'All' || r.kind === type)
      .filter(r => status === 'All' || r.status === status)
      .filter(r => site === 'All' || r.sites.includes(site) || r.sites.includes('All'))
      .filter(r => currency === 'All' || (r.currency || 'USD') === currency)
  , [discounts, q, type, status, site, currency])

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
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {getErrorMessage(error)}
        </div>
      )}
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
          {['All', ...Array.from(new Set(discounts.flatMap(d => d.sites)))].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={currency} onChange={e => setCurrency(e.target.value)} className="select">
          {['All', 'USD', 'EUR', 'UGX', 'KES', 'CNY'].map(o => <option key={o}>{o}</option>)}
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
            {isLoading && (
              <tr>
                <td colSpan={canEdit ? 8 : 7} className="p-8 text-center text-subtle">Loading discounts...</td>
              </tr>
            )}
            {!isLoading && filtered.map(r => (
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
        {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No discounts match your filters.</div>}
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


