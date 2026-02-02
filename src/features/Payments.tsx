import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { usePayments } from '@/modules/finance/payments/usePayments'
import { getErrorMessage } from '@/core/api/errors'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

/* ─────────────────────────────────────────────────────────────────────────────
   Payments — Payments & Settlements tracking
   RBAC: Operators, Owners, Site Owners
───────────────────────────────────────────────────────────────────────────── */

type PaymentType = 'Session' | 'Swap' | 'Settlement' | 'Fee'
type PaymentStatus = 'Settled' | 'Sent' | 'Applied' | 'Pending' | 'Refunded'

interface Payment {
  ref: string
  type: PaymentType
  site: string
  method: string
  amount: number
  fee: number
  net: number
  date: string
  status: PaymentStatus
}

function normalizeType(value: unknown): PaymentType {
  const v = String(value || '').toLowerCase()
  if (v.includes('swap')) return 'Swap'
  if (v.includes('settle')) return 'Settlement'
  if (v.includes('fee')) return 'Fee'
  return 'Session'
}

function normalizeStatus(value: unknown): PaymentStatus {
  const v = String(value || '').toLowerCase()
  if (v.includes('refund')) return 'Refunded'
  if (v.includes('apply')) return 'Applied'
  if (v.includes('sent')) return 'Sent'
  if (v.includes('settle') || v.includes('paid')) return 'Settled'
  return 'Pending'
}

function formatDateInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

function mapPayment(p: any): Payment {
  const amount = Number(p.amount ?? p.grossAmount ?? p.total ?? 0)
  const fee = Number(p.fee ?? p.fees ?? 0)
  const net = Number(p.net ?? p.netAmount ?? (Number.isFinite(amount) ? amount - fee : 0))
  const ref = p.ref ?? p.reference ?? p.id ?? '—'
  const type = normalizeType(p.type ?? p.paymentType)
  const status = normalizeStatus(p.status)
  const method = p.method ?? p.paymentMethod ?? p.channel ?? '—'
  const site = p.site ?? p.stationName ?? p.stationId ?? p.location ?? '—'
  const date = p.date ?? p.createdAt ?? p.timestamp ?? ''
  return { ref, type, site, method, amount, fee, net, date, status }
}

export function Payments() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'billing', 'view')
  const canRefund = hasPermission(role, 'billing', 'refund')

  const { data: paymentsData, isLoading, error } = usePayments()

  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [site, setSite] = useState('All')
  const [from, setFrom] = useState(() => formatDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
  const [to, setTo] = useState(() => formatDateInput(new Date()))
  const [q, setQ] = useState('')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const payments = useMemo(() => {
    const raw = Array.isArray(paymentsData) ? paymentsData : []
    return raw.map(mapPayment)
  }, [paymentsData])

  const siteOptions = useMemo(() => {
    const set = new Set<string>()
    payments.forEach((p) => {
      if (p.site) set.add(p.site)
    })
    return ['All', ...Array.from(set)]
  }, [payments])

  const filtered = useMemo(() =>
    payments
      .filter(r => type === 'All' || r.type === type)
      .filter(r => status === 'All' || r.status === status)
      .filter(r => site === 'All' || r.site === site)
      .filter(r => !q || (r.ref + ' ' + r.site).toLowerCase().includes(q.toLowerCase()))
      .filter(r => new Date(r.date) >= new Date(from) && new Date(r.date) <= new Date(to + 'T23:59:59'))
  , [payments, type, status, site, from, to, q])

  const totals = useMemo(() => ({
    gross: filtered.reduce((sum, r) => sum + r.amount, 0),
    fees: filtered.reduce((sum, r) => sum + r.fee, 0),
    net: filtered.reduce((sum, r) => sum + r.net, 0),
  }), [filtered])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Payments.</div>
  }

  return (
    <DashboardLayout pageTitle="Payments & Settlements">
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
            <div className="text-sm text-subtle">Transactions</div>
            <div className="mt-2 text-2xl font-bold">{filtered.length}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Gross</div>
            <div className="mt-2 text-2xl font-bold">${totals.gross.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Fees</div>
            <div className="mt-2 text-2xl font-bold">${totals.fees.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Net</div>
            <div className="mt-2 text-2xl font-bold">${totals.net.toFixed(2)}</div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-7 gap-3">
          <label className="relative md:col-span-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search ref / site" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
          </label>
        <select value={type} onChange={e => setType(e.target.value)} className="select">
          {['All', 'Session', 'Swap', 'Settlement', 'Fee'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="select">
          {['All', 'Settled', 'Sent', 'Applied', 'Pending', 'Refunded'].map(o => <option key={o}>{o}</option>)}
        </select>
          <select value={site} onChange={e => setSite(e.target.value)} className="select">
            {siteOptions.map(o => <option key={o}>{o}</option>)}
          </select>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input" />
        </section>

        {/* Export */}
        <div className="flex justify-end">
          <button onClick={() => toast('Exported CSV (demo)')} className="px-4 py-2 rounded-lg border border-border hover:bg-muted flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Export CSV
          </button>
        </div>

        {/* Table */}
        <section className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
            <tr>
              <th>Ref</th>
              <th>Type</th>
              <th>Site / Station</th>
              <th>Method</th>
              <th className="px-4 py-3 !text-right font-medium">Amount</th>
              <th className="px-4 py-3 !text-right font-medium">Fee</th>
              <th className="px-4 py-3 !text-right font-medium">Net</th>
              <th>Date</th>
              <th>Status</th>
              <th className="px-4 py-3 !text-right font-medium">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.ref} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{r.ref}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">{r.site}</td>
                  <td className="px-4 py-3">{r.method}</td>
                  <td className="px-4 py-3 text-right">${r.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${r.fee.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">${r.net.toFixed(2)}</td>
                  <td className="px-4 py-3 text-subtle">{r.date}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => toast(`Downloaded receipt for ${r.ref}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Receipt</button>
                      {canRefund && r.status !== 'Refunded' && r.type === 'Session' && (
                        <button onClick={() => toast(`Refunded ${r.ref}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Refund</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && (
            <div className="p-8">
              <TextSkeleton lines={2} centered />
            </div>
          )}
          {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No payments match your filters.</div>}
        </section>
      </div>
    </DashboardLayout>
  )
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const colors: Record<PaymentStatus, string> = {
    Settled: 'bg-emerald-100 text-emerald-700',
    Sent: 'bg-blue-100 text-blue-700',
    Applied: 'bg-gray-100 text-gray-600',
    Pending: 'bg-amber-100 text-amber-700',
    Refunded: 'bg-rose-100 text-rose-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default Payments

