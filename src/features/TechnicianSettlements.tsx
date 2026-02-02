import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useWithdrawalHistory } from '@/modules/finance/withdrawals/useWithdrawals'
import { getErrorMessage } from '@/core/api/errors'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import type { WithdrawalTransaction, PaymentMethodType } from '@/core/api/types'

/* ─────────────────────────────────────────────────────────────────────────────
   Technician Settlements — Payout summary and job-level lines
   RBAC: Technicians (own), Admins (all)
───────────────────────────────────────────────────────────────────────────── */

type SettlementStatus = 'Pending' | 'Approved' | 'Paid' | 'Flagged'

type SettlementRow = WithdrawalTransaction & {
  statusLabel: SettlementStatus
  methodLabel: string
}

const mapStatus = (status: WithdrawalTransaction['status']): SettlementStatus => {
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

export function TechnicianSettlements() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'TECHNICIAN_ORG'
  const isTechnician = role.startsWith('TECHNICIAN')
  const canView = hasPermission(role, 'earnings', 'view')

  const { data: withdrawalsData, isLoading, error } = useWithdrawalHistory()

  const [period, setPeriod] = useState('This Month')
  const [status, setStatus] = useState('All')
  const [method, setMethod] = useState('All')
  const [q, setQ] = useState('')
  const [selectedLine, setSelectedLine] = useState<SettlementRow | null>(null)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const settlements = useMemo<SettlementRow[]>(() => {
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
    settlements
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
  , [settlements, status, method, q, periodFilter])

  const totals = useMemo(() => {
    return filtered.reduce((acc, r) => {
      acc.amount += r.amount
      acc.fees += r.fee
      acc.net += r.netAmount
      return acc
    }, { amount: 0, fees: 0, net: 0 })
  }, [filtered])

  const kpis = useMemo(() => ({
    payable: filtered.filter(r => r.statusLabel === 'Pending').reduce((sum, r) => sum + r.netAmount, 0),
    paid: filtered.filter(r => r.statusLabel === 'Paid').reduce((sum, r) => sum + r.netAmount, 0),
    pending: filtered.filter(r => r.statusLabel === 'Pending').length,
    approved: filtered.filter(r => r.statusLabel === 'Approved').reduce((sum, r) => sum + r.netAmount, 0),
  }), [filtered])

  const downloadStatement = () => {
    const statement = {
      period,
      totals,
      lines: filtered.map(r => ({
        ...r,
        net: r.netAmount,
      })),
    }
    const blob = new Blob([JSON.stringify(statement, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `technician_settlement_${period.replace(/\s+/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast('Statement downloaded')
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Settlements.</div>
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
          <div className="text-sm text-subtle">Payable This Period</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">${kpis.payable.toFixed(2)}</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">Paid MTD</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">${kpis.paid.toFixed(2)}</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">Pending</div>
          <div className="mt-2 text-2xl font-bold">{kpis.pending}</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">Approved</div>
          <div className="mt-2 text-2xl font-bold text-blue-600">${kpis.approved.toFixed(2)}</div>
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
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search payout / reference" className="input pl-9" />
        </label>
      </section>

      {/* Table */}
      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-subtle">
            <tr>
              <th className="w-24">Payout</th>
              <th className="w-28">Reference</th>
              <th className="w-24">Created</th>
              <th className="w-20 px-4 py-3 !text-right font-medium">Amount</th>
              <th className="w-16 px-4 py-3 !text-right font-medium">Fee</th>
              <th className="w-16 px-4 py-3 !text-right font-medium">Net</th>
              <th className="w-24">Method</th>
              <th className="w-20">Status</th>
              <th className="w-24 px-4 py-3 !text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-muted/50 text-xs">
                <td className="px-4 py-3 font-medium truncate max-w-[96px]">
                  <button onClick={() => setSelectedLine(r)} className="text-accent hover:underline" title={r.id}>
                    {r.id}
                  </button>
                </td>
                <td className="px-4 py-3 text-subtle truncate max-w-[112px]" title={r.reference}>{r.reference || '—'}</td>
                <td className="px-4 py-3 text-subtle whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">${r.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-subtle whitespace-nowrap">-${r.fee.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">${r.netAmount.toFixed(2)}</td>
                <td className="px-4 py-3 truncate max-w-[96px]">{r.methodLabel}</td>
                <td className="px-4 py-3"><StatusPill status={r.statusLabel} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedLine(r)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">
                    Details
                  </button>
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
        {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No settlement lines match your filters.</div>}
      </section>

      {/* Totals */}
      <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Summary</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-subtle">Total Amount:</span>
              <span className="font-medium">${totals.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle">Total Fees:</span>
              <span className="font-medium text-subtle">-${totals.fees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle">Net Payable:</span>
              <span className="font-medium">${totals.net.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-semibold">
              <span>Net Payable:</span>
              <span className="text-accent">${totals.net.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Export */}
      <div className="flex justify-end">
        <button onClick={downloadStatement} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
          Generate Statement
        </button>
      </div>

      {/* Detail Drawer */}
      {selectedLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedLine(null)}>
          <div className="bg-surface rounded-xl border border-border p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Settlement Details — {selectedLine.id}</h3>
              <button onClick={() => setSelectedLine(null)} className="text-subtle hover:text-fg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-subtle">Date:</span>
                  <div className="font-medium">{new Date(selectedLine.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-subtle">Reference:</span>
                  <div className="font-medium">{selectedLine.reference || '—'}</div>
                </div>
                <div>
                  <span className="text-subtle">Method:</span>
                  <div className="font-medium">{selectedLine.methodLabel}</div>
                </div>
                <div>
                  <span className="text-subtle">Status:</span>
                  <div><StatusPill status={selectedLine.statusLabel} /></div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-2">Breakdown</h4>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">${selectedLine.amount.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Fee:</span>
                    <span className="font-medium">-${selectedLine.fee.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Net:</span>
                    <span className="font-medium">${selectedLine.netAmount.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between pt-2 border-t border-border font-semibold">
                    <span>Net Payable:</span>
                    <span className="text-accent">${selectedLine.netAmount.toFixed(2)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: SettlementStatus }) {
  const colors: Record<SettlementStatus, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Approved: 'bg-blue-100 text-blue-700',
    Paid: 'bg-emerald-100 text-emerald-700',
    Flagged: 'bg-rose-100 text-rose-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default TechnicianSettlements

