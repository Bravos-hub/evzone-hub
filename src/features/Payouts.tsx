import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useWithdrawalHistory } from '@/modules/finance/withdrawals/useWithdrawals'
import { getErrorMessage } from '@/core/api/errors'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import type { WithdrawalTransaction, PaymentMethodType } from '@/core/api/types'

/* ─────────────────────────────────────────────────────────────────────────────
   Payouts — Technician payout tracking and management
   RBAC: Technicians (own), Admins (all), Operators (assigned)
───────────────────────────────────────────────────────────────────────────── */

type PayoutStatus = 'Pending' | 'Approved' | 'Paid' | 'Flagged'

type PayoutRow = WithdrawalTransaction & {
  statusLabel: PayoutStatus
  methodLabel: string
}

const mapStatus = (status: WithdrawalTransaction['status']): PayoutStatus => {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'processing':
      return 'Approved'
    case 'completed':
      return 'Paid'
    case 'failed':
    default:
      return 'Flagged'
  }
}

const mapMethod = (method: PaymentMethodType) => {
  switch (method) {
    case 'mobile':
      return 'Mobile Money'
    case 'bank':
      return 'Bank'
    case 'wallet':
      return 'Wallet'
    case 'card':
      return 'Card'
    default:
      return 'Other'
  }
}

export function Payouts() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'TECHNICIAN_ORG'
  const isTechnician = role.startsWith('TECHNICIAN')
  const canView = hasPermission(role, 'earnings', 'view')
  const canApprove = hasPermission(role, 'settlement', 'view') // Admin/Operator can approve

  const { data: withdrawalsData, isLoading, error } = useWithdrawalHistory()

  const [period, setPeriod] = useState('This Month')
  const [status, setStatus] = useState('All')
  const [method, setMethod] = useState('All')
  const [q, setQ] = useState('')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const payouts = useMemo<PayoutRow[]>(() => {
    const raw = Array.isArray(withdrawalsData) ? withdrawalsData : (withdrawalsData as any)?.data || []
    return raw.map((tx: WithdrawalTransaction) => ({
      ...tx,
      statusLabel: mapStatus(tx.status),
      methodLabel: mapMethod(tx.method),
    }))
  }, [withdrawalsData])

  const periodFilter = useMemo(() => {
    if (period === 'All Time') return null
    const now = new Date()
    if (period === 'This Week') {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      return { start, end: now }
    }
    if (period === 'This Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start, end: now }
    }
    if (period === 'Last Month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      return { start, end }
    }
    return null
  }, [period])

  const filtered = useMemo(() =>
    payouts
      .filter(r => status === 'All' || r.statusLabel === status)
      .filter(r => method === 'All' || r.methodLabel === method)
      .filter(r => {
        if (!q) return true
        const hay = `${r.id} ${r.reference} ${r.paymentMethodLabel || ''}`.toLowerCase()
        return hay.includes(q.toLowerCase())
      })
      .filter(r => {
        if (!periodFilter) return true
        const created = new Date(r.createdAt)
        return created >= periodFilter.start && created <= periodFilter.end
      })
  , [payouts, status, method, q, periodFilter])

  const kpis = useMemo(() => ({
    pending: filtered.filter(p => p.statusLabel === 'Pending').reduce((sum, p) => sum + p.netAmount, 0),
    approved: filtered.filter(p => p.statusLabel === 'Approved').reduce((sum, p) => sum + p.netAmount, 0),
    paid: filtered.filter(p => p.statusLabel === 'Paid').reduce((sum, p) => sum + p.netAmount, 0),
    total: filtered.length,
  }), [filtered])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Payouts.</div>
  }

  return (
    <DashboardLayout pageTitle="Technician Payouts">
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
            <div className="text-sm text-subtle">Pending</div>
            <div className="mt-2 text-2xl font-bold text-amber-600">${kpis.pending.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Approved</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">${kpis.approved.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Paid</div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">${kpis.paid.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">Total Lines</div>
            <div className="mt-2 text-2xl font-bold">{kpis.total}</div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-5 gap-3">
        <select value={period} onChange={e => setPeriod(e.target.value)} className="select">
          {['This Week', 'This Month', 'Last Month', 'All Time'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="select">
          {['All', 'Pending', 'Approved', 'Paid', 'Flagged'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={method} onChange={e => setMethod(e.target.value)} className="select">
          {['All', 'Mobile Money', 'Bank', 'Wallet', 'Card', 'Other'].map(o => <option key={o}>{o}</option>)}
        </select>
          <label className="relative md:col-span-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search payout / reference" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
          </label>
        </section>

        {/* Table */}
        <section className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
            <tr>
              <th className="w-24">Payout</th>
              <th className="w-28">Reference</th>
              <th className="w-24">Method</th>
              <th className="w-24">Created</th>
              <th className="w-20 px-4 py-3 !text-right font-medium">Amount</th>
              <th className="w-16 px-4 py-3 !text-right font-medium">Fee</th>
              <th className="w-16 px-4 py-3 !text-right font-medium">Net</th>
              <th className="w-20">Status</th>
              {canApprove && <th className="w-24 px-4 py-3 !text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-muted/50 text-xs">
                <td className="px-4 py-3 font-medium truncate max-w-[96px]" title={p.id}>{p.id}</td>
                <td className="px-4 py-3 text-subtle truncate max-w-[96px]" title={p.reference}>{p.reference || '—'}</td>
                <td className="px-4 py-3 truncate max-w-[96px]">{p.methodLabel}</td>
                <td className="px-4 py-3 text-subtle whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">${p.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-subtle whitespace-nowrap">-${p.fee.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">${p.netAmount.toFixed(2)}</td>
                <td className="px-4 py-3"><StatusPill status={p.statusLabel} /></td>
                {canApprove && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {p.statusLabel === 'Pending' && (
                        <button onClick={() => toast(`Approved ${p.id}`)} className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs">Approve</button>
                      )}
                      {p.statusLabel === 'Approved' && (
                        <button onClick={() => toast(`Marked ${p.id} as paid`)} className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs">Mark Paid</button>
                      )}
                      {p.statusLabel !== 'Flagged' && (
                        <button onClick={() => toast(`Flagged ${p.id}`)} className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs">Flag</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            </tbody>
          </table>
          {isLoading && (
            <div className="p-8">
              <TextSkeleton lines={2} centered />
            </div>
          )}
          {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No payouts match your filters.</div>}
        </section>

        {/* Breakdown Info (for technicians) */}
        {isTechnician && (
          <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Payout Breakdown</h3>
            <p className="text-sm text-subtle mb-3">Your payouts are calculated as follows:</p>
            <ul className="text-sm space-y-1 text-subtle">
              <li>? <strong>Amount:</strong> Total payout requested</li>
              <li>? <strong>Fee:</strong> Processing and platform fees</li>
              <li>? <strong>Net:</strong> Amount minus fees</li>
            </ul>
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}

function StatusPill({ status }: { status: PayoutStatus }) {
  const colors: Record<PayoutStatus, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-blue-100 text-blue-700',
    Paid: 'bg-emerald-100 text-emerald-700',
    Flagged: 'bg-rose-100 text-rose-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default Payouts

