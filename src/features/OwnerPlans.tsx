import { useMemo, useState } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useSubscriptionPlans } from '@/modules/subscriptions/hooks/useSubscriptionPlans'
import { getErrorMessage } from '@/core/api/errors'

/* ─────────────────────────────────────────────────────────────────────────────
   Owner Plans — Pricing plans and memberships
   RBAC: Owners, Platform admins
───────────────────────────────────────────────────────────────────────────── */

type PlanType = 'TOU' | 'Membership' | 'Fleet'
type PlanStatus = 'Active' | 'Paused' | 'Draft'

interface Plan {
  id: string
  name: string
  kind: PlanType
  status: PlanStatus
  currency: string
  rate: string
  sites: string[]
  notes: string
}

function inferKind(name: string, code?: string): PlanType {
  const v = `${name} ${code || ''}`.toLowerCase()
  if (v.includes('fleet')) return 'Fleet'
  if (v.includes('member')) return 'Membership'
  return 'TOU'
}

function inferStatus(isActive?: boolean, isPublic?: boolean): PlanStatus {
  if (isActive) return 'Active'
  if (!isActive && isPublic) return 'Paused'
  return 'Draft'
}

export function OwnerPlans() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'STATION_OWNER'
  const canView = hasPermission(role, 'tariffs', 'view')
  const canEdit = hasPermission(role, 'tariffs', 'edit')

  const { data: plansData, isLoading, error } = useSubscriptionPlans({ isPublic: true })

  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [currency, setCurrency] = useState('USD')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const plans = useMemo<Plan[]>(() => {
    const raw = Array.isArray(plansData) ? plansData : []
    return raw.map((p: any) => ({
      id: p.id ?? p.code ?? '—',
      name: p.name ?? 'Unnamed Plan',
      kind: inferKind(p.name ?? '', p.code),
      status: inferStatus(p.isActive, p.isPublic),
      currency: p.currency ?? 'USD',
      rate: p.price != null ? `${p.currency ?? 'USD'} ${Number(p.price).toFixed(2)} / ${p.billingCycle?.toLowerCase?.() ?? 'mo'}` : '—',
      sites: p.sites ?? ['All'],
      notes: p.description ?? '',
    }))
  }, [plansData])

  const filtered = useMemo(() =>
    plans
      .filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))
      .filter(p => type === 'All' || (type === 'TOU' ? p.kind === 'TOU' : p.kind === type))
      .filter(p => status === 'All' || p.status === status)
      .filter(p => p.currency === currency)
  , [plans, q, type, status, currency])

  const kpis = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter(p => p.status === 'Active').length,
    touPlans: filtered.filter(p => p.kind === 'TOU').length,
    paused: filtered.filter(p => p.status === 'Paused').length,
  }), [filtered])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Owner Plans.</div>
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
        {[
          { label: 'Total Plans', value: kpis.total },
          { label: 'Active', value: kpis.active },
          { label: 'TOU Plans', value: kpis.touPlans },
          { label: 'Paused', value: kpis.paused },
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
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search plans" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <select value={type} onChange={e => setType(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['All', 'TOU', 'Membership', 'Fleet'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['All', 'Active', 'Paused', 'Draft'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={currency} onChange={e => setCurrency(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['USD', 'EUR', 'UGX', 'KES', 'CNY'].map(o => <option key={o}>{o}</option>)}
        </select>
      </section>

      {/* Actions */}
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => toast('Create Plan modal would open')} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            New Plan
          </button>
        </div>
      )}

      {/* Plan Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <div key={p.id} className="rounded-xl bg-surface border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <TypePill type={p.kind} />
                  <StatusPill status={p.status} />
                </div>
              </div>
              <svg className="w-5 h-5 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l7 4v6a7 7 0 11-14 0V6l7-4z" /></svg>
            </div>
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-subtle">Rate: </span>
                <span className="font-medium">{p.rate}</span>
              </div>
              <div className="text-sm">
                <span className="text-subtle">Sites: </span>
                <span className="font-medium">{p.sites.join(', ')}</span>
              </div>
              <div className="text-xs text-subtle">{p.notes}</div>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button onClick={() => toast(`View ${p.name}`)} className="flex-1 px-3 py-1.5 rounded border border-border hover:bg-muted text-sm">
                  View
                </button>
                <button onClick={() => toast(`Edit ${p.name}`)} className="flex-1 px-3 py-1.5 rounded bg-accent text-white hover:bg-accent-hover text-sm">
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
      {isLoading && <div className="p-8 text-center text-subtle">Loading plans...</div>}
      {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No plans match your filters.</div>}
    </div>
  )
}

function TypePill({ type }: { type: PlanType }) {
  const colors: Record<PlanType, string> = {
    TOU: 'bg-blue-100 text-blue-700',
    Membership: 'bg-purple-100 text-purple-700',
    Fleet: 'bg-emerald-100 text-emerald-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[type]}`}>{type}</span>
}

function StatusPill({ status }: { status: PlanStatus }) {
  const colors: Record<PlanStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Paused: 'bg-amber-100 text-amber-700',
    Draft: 'bg-gray-100 text-gray-600',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default OwnerPlans


