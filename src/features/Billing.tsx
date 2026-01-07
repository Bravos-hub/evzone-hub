import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Refunded'
type InvoiceType = 'Subscription' | 'Usage' | 'Settlement' | 'Credit'

type Invoice = {
  id: string
  type: InvoiceType
  org: string
  amount: number
  currency: string
  status: InvoiceStatus
  issuedAt: string
  dueAt: string
  paidAt?: string
  description: string
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockInvoices: Invoice[] = [
  {
    id: 'INV-2024-0012',
    type: 'Usage',
    org: 'Volt Mobility Ltd',
    amount: 12450.00,
    currency: 'USD',
    status: 'Paid',
    issuedAt: '2024-12-01',
    dueAt: '2024-12-15',
    paidAt: '2024-12-10',
    description: 'November 2024 Usage - 4,532 sessions',
  },
  {
    id: 'INV-2024-0011',
    type: 'Subscription',
    org: 'Volt Mobility Ltd',
    amount: 2500.00,
    currency: 'USD',
    status: 'Paid',
    issuedAt: '2024-12-01',
    dueAt: '2024-12-15',
    paidAt: '2024-12-05',
    description: 'Pro Plan - December 2024',
  },
  {
    id: 'INV-2024-0010',
    type: 'Settlement',
    org: 'GridCity Ltd',
    amount: 8920.50,
    currency: 'USD',
    status: 'Pending',
    issuedAt: '2024-12-05',
    dueAt: '2024-12-20',
    description: 'Settlement payout - November 2024',
  },
  {
    id: 'INV-2024-0009',
    type: 'Usage',
    org: 'SunRun Ops',
    amount: 3200.00,
    currency: 'USD',
    status: 'Overdue',
    issuedAt: '2024-11-15',
    dueAt: '2024-11-30',
    description: 'October 2024 Usage - 1,245 sessions',
  },
  {
    id: 'INV-2024-0008',
    type: 'Credit',
    org: 'Mall Holdings',
    amount: -500.00,
    currency: 'USD',
    status: 'Refunded',
    issuedAt: '2024-11-20',
    dueAt: '2024-11-20',
    paidAt: '2024-11-20',
    description: 'Credit note - Service disruption compensation',
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Billing Page - Unified for all roles
 * 
 * RBAC Controls:
 * - viewAll: ADMIN, OPERATOR see all invoices
 * - export: ADMIN can export
 * - refund: ADMIN, OPERATOR can issue refunds
 * - adjustments: ADMIN can make adjustments
 */
export function Billing() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'billing')

  const [q, setQ] = useState('')
  const [type, setType] = useState<InvoiceType | 'All'>('All')
  const [status, setStatus] = useState<InvoiceStatus | 'All'>('All')
  const [org, setOrg] = useState<string>('All')

  // Filter invoices - in real app, filter by user's access
  const filtered = useMemo(() => {
    return mockInvoices
      .filter((r) => (q ? (r.id + ' ' + r.org + ' ' + r.description).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (type === 'All' ? true : r.type === type))
      .filter((r) => (status === 'All' ? true : r.status === status))
      .filter((r) => (org === 'All' ? true : r.org === org))
  }, [q, type, status, org])

  const orgs = useMemo(() => {
    const set = new Set(mockInvoices.map((i) => i.org))
    return ['All', ...Array.from(set)]
  }, [])

  const stats = useMemo(() => ({
    total: filtered.reduce((acc, i) => acc + Math.abs(i.amount), 0),
    paid: filtered.filter((i) => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0),
    pending: filtered.filter((i) => i.status === 'Pending').reduce((acc, i) => acc + i.amount, 0),
    overdue: filtered.filter((i) => i.status === 'Overdue').reduce((acc, i) => acc + i.amount, 0),
  }), [filtered])

  function statusColor(s: InvoiceStatus) {
    switch (s) {
      case 'Paid': return 'approved'
      case 'Pending': return 'pending'
      case 'Overdue': return 'rejected'
      case 'Refunded': return 'sendback'
    }
  }

  return (
    <DashboardLayout pageTitle="Billing">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Volume</div>
          <div className="text-xl font-bold text-text">${stats.total.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Paid</div>
          <div className="text-xl font-bold text-ok">${stats.paid.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Pending</div>
          <div className="text-xl font-bold text-warn">${stats.pending.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Overdue</div>
          <div className="text-xl font-bold text-danger">${stats.overdue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search invoices"
            className="input col-span-2 xl:col-span-1"
          />
          <select value={type} onChange={(e) => setType(e.target.value as InvoiceType | 'All')} className="select">
            <option value="All">All Types</option>
            <option value="Usage">Usage</option>
            <option value="Subscription">Subscription</option>
            <option value="Settlement">Settlement</option>
            <option value="Credit">Credit</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus | 'All')} className="select">
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Refunded">Refunded</option>
          </select>
          {perms.viewAll && (
            <select value={org} onChange={(e) => setOrg(e.target.value)} className="select">
              {orgs.map((o) => (
                <option key={o} value={o}>{o === 'All' ? 'All Organizations' : o}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mb-4">
        {perms.export && (
          <button className="btn secondary" onClick={() => alert('Export invoices (demo)')}>
            Export
          </button>
        )}
        {perms.adjustments && (
          <button className="btn secondary" onClick={() => alert('Create credit note (demo)')}>
            + Credit Note
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="w-24">Invoice</th>
              <th className="w-24">Type</th>
              {perms.viewAll && <th className="w-32">Organization</th>}
              <th className="w-48">Description</th>
              <th className="w-20 !text-right">Amount</th>
              <th className="w-20">Status</th>
              <th className="w-24">Issued</th>
              <th className="w-24">Due</th>
              <th className="w-24 !text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold truncate max-w-[96px]" title={r.id}>{r.id}</td>
                <td>
                  <span className="chip text-xs">{r.type}</span>
                </td>
                {perms.viewAll && <td className="truncate max-w-[128px]" title={r.org}>{r.org}</td>}
                <td className="text-sm text-muted max-w-[192px] truncate" title={r.description}>{r.description}</td>
                <td className="text-right font-semibold whitespace-nowrap">
                  <span className={r.amount < 0 ? 'text-danger' : ''}>
                    {r.amount < 0 ? '-' : ''}${Math.abs(r.amount).toLocaleString()}
                  </span>
                </td>
                <td>
                  <span className={`pill whitespace-nowrap ${statusColor(r.status)}`}>{r.status}</span>
                </td>
                <td className="text-sm whitespace-nowrap">{r.issuedAt}</td>
                <td className="text-sm whitespace-nowrap">{r.dueAt}</td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button className="btn secondary" onClick={() => alert(`View ${r.id} (demo)`)}>
                      View
                    </button>
                    {perms.refund && r.status === 'Paid' && (
                      <button className="btn secondary" onClick={() => alert(`Refund ${r.id} (demo)`)}>
                        Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

