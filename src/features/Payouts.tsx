import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Payouts — Technician payout tracking and management
   RBAC: Technicians (own), Admins (all), Operators (assigned)
───────────────────────────────────────────────────────────────────────────── */

type PayoutStatus = 'Pending' | 'Approved' | 'Paid' | 'Flagged'

interface Payout {
  id: string
  jobId: string
  site: string
  date: string
  hours: number
  rate: number
  travel: number
  parts: number
  platformFee: number
  withholding: number
  method: 'Mobile Money' | 'Bank'
  status: PayoutStatus
}

const MOCK_PAYOUTS: Payout[] = [
  { id: 'PO-4312', jobId: 'JOB-4312', site: 'Central Hub', date: '2025-11-03', hours: 2.0, rate: 25, travel: 5, parts: 0, platformFee: 2, withholding: 1.5, method: 'Mobile Money', status: 'Pending' },
  { id: 'PO-4301', jobId: 'JOB-4301', site: 'Airport East', date: '2025-11-02', hours: 1.5, rate: 25, travel: 0, parts: 10, platformFee: 2, withholding: 2.0, method: 'Bank', status: 'Approved' },
  { id: 'PO-4295', jobId: 'JOB-4295', site: 'Tech Park', date: '2025-10-30', hours: 3.0, rate: 25, travel: 4, parts: 0, platformFee: 2, withholding: 2.5, method: 'Mobile Money', status: 'Paid' },
  { id: 'PO-4288', jobId: 'JOB-4288', site: 'Central Hub', date: '2025-10-28', hours: 1.0, rate: 25, travel: 5, parts: 15, platformFee: 2, withholding: 1.0, method: 'Bank', status: 'Paid' },
  { id: 'PO-4280', jobId: 'JOB-4280', site: 'Business Park', date: '2025-10-25', hours: 4.0, rate: 25, travel: 10, parts: 0, platformFee: 2, withholding: 3.0, method: 'Mobile Money', status: 'Flagged' },
]

export function Payouts() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'TECHNICIAN_ORG'
  const isTechnician = role.startsWith('TECHNICIAN')
  const canView = hasPermission(role, 'earnings', 'view')
  const canApprove = hasPermission(role, 'settlement', 'view') // Admin/Operator can approve

  const [period, setPeriod] = useState('This Month')
  const [status, setStatus] = useState('All')
  const [method, setMethod] = useState('All')
  const [q, setQ] = useState('')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const filtered = useMemo(() =>
    MOCK_PAYOUTS
      .filter(r => status === 'All' || r.status === status)
      .filter(r => method === 'All' || r.method === method)
      .filter(r => !q || (r.id + ' ' + r.jobId + ' ' + r.site).toLowerCase().includes(q.toLowerCase()))
  , [status, method, q])

  const calculateNet = (p: Payout) => {
    const gross = p.hours * p.rate + p.travel + p.parts
    const deductions = p.platformFee + p.withholding
    return gross - deductions
  }

  const kpis = useMemo(() => ({
    pending: filtered.filter(p => p.status === 'Pending').reduce((sum, p) => sum + calculateNet(p), 0),
    approved: filtered.filter(p => p.status === 'Approved').reduce((sum, p) => sum + calculateNet(p), 0),
    paid: filtered.filter(p => p.status === 'Paid').reduce((sum, p) => sum + calculateNet(p), 0),
    total: filtered.length,
  }), [filtered])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Payouts.</div>
  }

  return (
    <DashboardLayout pageTitle="Technician Payouts">
      <div className="space-y-6">
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
          {['All', 'Mobile Money', 'Bank'].map(o => <option key={o}>{o}</option>)}
        </select>
          <label className="relative md:col-span-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search payout / job / site" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
          </label>
        </section>

        {/* Table */}
        <section className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
            <tr>
              <th className="w-20">Payout</th>
              <th className="w-20">Job</th>
              <th className="w-28">Site</th>
              <th className="w-24">Date</th>
              <th className="w-16 px-4 py-3 !text-right font-medium">Gross</th>
              <th className="w-20 px-4 py-3 !text-right font-medium">Deductions</th>
              <th className="w-16 px-4 py-3 !text-right font-medium">Net</th>
              <th className="w-24">Method</th>
              <th className="w-20">Status</th>
              {canApprove && <th className="w-24 px-4 py-3 !text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(p => {
              const gross = p.hours * p.rate + p.travel + p.parts
              const deductions = p.platformFee + p.withholding
              const net = gross - deductions
              return (
                <tr key={p.id} className="hover:bg-muted/50 text-xs">
                  <td className="px-4 py-3 font-medium truncate max-w-[80px]" title={p.id}>{p.id}</td>
                  <td className="px-4 py-3 text-accent hover:underline cursor-pointer truncate max-w-[80px]" title={p.jobId}>{p.jobId}</td>
                  <td className="px-4 py-3 truncate max-w-[112px]" title={p.site}>{p.site}</td>
                  <td className="px-4 py-3 text-subtle whitespace-nowrap">{p.date}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">${gross.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-subtle whitespace-nowrap">-${deductions.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">${net.toFixed(2)}</td>
                  <td className="px-4 py-3 truncate max-w-[96px]">{p.method}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                    {canApprove && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {p.status === 'Pending' && (
                            <button onClick={() => toast(`Approved ${p.id}`)} className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs">Approve</button>
                          )}
                          {p.status === 'Approved' && (
                            <button onClick={() => toast(`Marked ${p.id} as paid`)} className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs">Mark Paid</button>
                          )}
                          {p.status !== 'Flagged' && (
                            <button onClick={() => toast(`Flagged ${p.id}`)} className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs">Flag</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-subtle">No payouts match your filters.</div>}
        </section>

        {/* Breakdown Info (for technicians) */}
        {isTechnician && (
          <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Payout Breakdown</h3>
            <p className="text-sm text-subtle mb-3">Your payouts are calculated as follows:</p>
            <ul className="text-sm space-y-1 text-subtle">
              <li>• <strong>Base:</strong> Hours worked × Hourly rate ($25/hr)</li>
              <li>• <strong>Add-ons:</strong> Travel allowance + Parts/materials</li>
              <li>• <strong>Deductions:</strong> Platform fee + Tax withholding</li>
              <li>• <strong>Net:</strong> (Base + Add-ons) - Deductions</li>
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

