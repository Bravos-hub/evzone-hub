import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Technician Settlements — Payout summary and job-level lines
   RBAC: Technicians (own), Admins (all)
───────────────────────────────────────────────────────────────────────────── */

type SettlementStatus = 'Pending' | 'Approved' | 'Paid'
type PayoutMethod = 'Mobile Money' | 'Bank'

interface SettlementLine {
  id: string
  date: string
  site: string
  hours: number
  rate: number
  travel: number
  parts: number
  allowance: number
  platformFee: number
  withholding: number
  method: PayoutMethod
  status: SettlementStatus
}

const MOCK_LINES: SettlementLine[] = [
  { id: 'JOB-4312', date: '2025-11-03T10:00', site: 'Central Hub', hours: 2.0, rate: 25, travel: 5, parts: 0, allowance: 3, platformFee: 2, withholding: 1.5, method: 'Mobile Money', status: 'Pending' },
  { id: 'JOB-4301', date: '2025-11-02T15:30', site: 'Airport East', hours: 1.5, rate: 25, travel: 0, parts: 10, allowance: 0, platformFee: 2, withholding: 2.0, method: 'Bank', status: 'Approved' },
  { id: 'JOB-4295', date: '2025-10-30T09:00', site: 'Tech Park', hours: 3.0, rate: 25, travel: 4, parts: 0, allowance: 0, platformFee: 2, withholding: 2.5, method: 'Mobile Money', status: 'Paid' },
  { id: 'JOB-4288', date: '2025-10-28T14:00', site: 'Business Park', hours: 1.0, rate: 25, travel: 5, parts: 15, allowance: 0, platformFee: 2, withholding: 1.0, method: 'Bank', status: 'Paid' },
]

function calculateNet(r: SettlementLine) {
  const base = r.hours * r.rate
  const adds = r.travel + r.parts + r.allowance
  const fees = r.platformFee
  const tax = r.withholding || 0
  return Math.max(0, base + adds - fees - tax)
}

export function TechnicianSettlements() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'TECHNICIAN_ORG'
  const isTechnician = role.startsWith('TECHNICIAN')
  const canView = hasPermission(role, 'earnings', 'view')

  const [period, setPeriod] = useState('This Month')
  const [status, setStatus] = useState('All')
  const [method, setMethod] = useState('All')
  const [q, setQ] = useState('')
  const [selectedLine, setSelectedLine] = useState<SettlementLine | null>(null)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const filtered = useMemo(() =>
    MOCK_LINES
      .filter(r => status === 'All' || r.status === status)
      .filter(r => method === 'All' || r.method === method)
      .filter(r => !q || (r.id + r.site).toLowerCase().includes(q.toLowerCase()))
  , [status, method, q])

  const totals = useMemo(() => {
    return filtered.reduce((acc, r) => {
      const base = r.hours * r.rate
      const adds = r.travel + r.parts + r.allowance
      const fees = r.platformFee
      const tax = r.withholding || 0
      const net = base + adds - fees - tax
      acc.base += base
      acc.adds += adds
      acc.fees += fees
      acc.tax += tax
      acc.net += net
      return acc
    }, { base: 0, adds: 0, fees: 0, tax: 0, net: 0 })
  }, [filtered])

  const kpis = useMemo(() => ({
    payable: filtered.filter(r => r.status === 'Pending').reduce((sum, r) => sum + calculateNet(r), 0),
    paid: filtered.filter(r => r.status === 'Paid').reduce((sum, r) => sum + calculateNet(r), 0),
    pending: filtered.filter(r => r.status === 'Pending').length,
    approved: filtered.filter(r => r.status === 'Approved').reduce((sum, r) => sum + calculateNet(r), 0),
  }), [filtered])

  const downloadStatement = () => {
    const statement = {
      period,
      totals,
      lines: filtered.map(r => ({
        ...r,
        net: calculateNet(r),
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
          {['All', 'Pending', 'Approved', 'Paid'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={method} onChange={e => setMethod(e.target.value)} className="select">
          {['All', 'Mobile Money', 'Bank'].map(o => <option key={o}>{o}</option>)}
        </select>
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search job / site" className="input pl-9" />
        </label>
      </section>

      {/* Table */}
      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-subtle">
            <tr>
              <th className="w-20">Job</th>
              <th className="w-24">Date</th>
              <th className="w-28">Site</th>
              <th className="w-16 px-4 py-3 !text-right font-medium">Gross</th>
              <th className="w-20 px-4 py-3 !text-right font-medium">Deductions</th>
              <th className="w-16 px-4 py-3 !text-right font-medium">Net</th>
              <th className="w-24">Method</th>
              <th className="w-20">Status</th>
              <th className="w-24 px-4 py-3 !text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => {
              const gross = r.hours * r.rate + r.travel + r.parts + r.allowance
              const deductions = r.platformFee + r.withholding
              const net = gross - deductions
              return (
                <tr key={r.id} className="hover:bg-muted/50 text-xs">
                  <td className="px-4 py-3 font-medium truncate max-w-[80px]">
                    <button onClick={() => setSelectedLine(r)} className="text-accent hover:underline" title={r.id}>
                      {r.id}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-subtle whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 truncate max-w-[112px]" title={r.site}>{r.site}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">${gross.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-subtle whitespace-nowrap">-${deductions.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">${net.toFixed(2)}</td>
                  <td className="px-4 py-3 truncate max-w-[96px]">{r.method}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelectedLine(r)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">
                      Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-subtle">No settlement lines match your filters.</div>}
      </section>

      {/* Totals */}
      <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Summary</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-subtle">Base (hours × rate):</span>
              <span className="font-medium">${totals.base.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle">Add-ons (travel + parts + allowance):</span>
              <span className="font-medium">${totals.adds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle">Platform fees:</span>
              <span className="font-medium text-subtle">-${totals.fees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle">Tax withholding:</span>
              <span className="font-medium text-subtle">-${totals.tax.toFixed(2)}</span>
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
                  <div className="font-medium">{new Date(selectedLine.date).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-subtle">Site:</span>
                  <div className="font-medium">{selectedLine.site}</div>
                </div>
                <div>
                  <span className="text-subtle">Method:</span>
                  <div className="font-medium">{selectedLine.method}</div>
                </div>
                <div>
                  <span className="text-subtle">Status:</span>
                  <div><StatusPill status={selectedLine.status} /></div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-2">Breakdown</h4>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Base ({selectedLine.hours}h × ${selectedLine.rate}/hr):</span>
                    <span className="font-medium">${(selectedLine.hours * selectedLine.rate).toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Travel:</span>
                    <span className="font-medium">${selectedLine.travel.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Parts:</span>
                    <span className="font-medium">${selectedLine.parts.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Allowance:</span>
                    <span className="font-medium">${selectedLine.allowance.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between text-subtle">
                    <span>Platform fee:</span>
                    <span>-${selectedLine.platformFee.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between text-subtle">
                    <span>Tax withholding:</span>
                    <span>-${selectedLine.withholding.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between pt-2 border-t border-border font-semibold">
                    <span>Net Payable:</span>
                    <span className="text-accent">${calculateNet(selectedLine).toFixed(2)}</span>
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
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default TechnicianSettlements

