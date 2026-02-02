import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { billingService } from '@/modules/finance/billing/billingService'
import { useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '@/core/api/errors'
import { PATHS } from '@/app/router/paths'
import { StatGridSkeleton, TableSkeleton } from '@/ui/components/SkeletonCards'

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

  const { data: invoicesData, isLoading, error } = useQuery({
    queryKey: ['invoices', 'all', { type: type !== 'All' ? type : undefined, status: status !== 'All' ? status : undefined }],
    queryFn: () => billingService.getInvoices({
      type: type !== 'All' ? type : undefined,
      status: status !== 'All' ? status : undefined,
    }),
  })

  // Map API invoices to display format
  const invoices = useMemo(() => {
    if (!invoicesData) return []
    return invoicesData.map(i => ({
      id: i.id,
      type: i.type as InvoiceType,
      org: i.org,
      amount: i.amount,
      currency: i.currency,
      status: i.status as InvoiceStatus,
      issuedAt: i.issuedAt,
      dueAt: i.dueAt,
      paidAt: i.paidAt,
      description: i.description,
    }))
  }, [invoicesData])

  // Filter invoices - in real app, filter by user's access
  const filtered = useMemo(() => {
    return invoices
      .filter((r) => (q ? (r.id + ' ' + r.org + ' ' + r.description).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (type === 'All' ? true : r.type === type))
      .filter((r) => (status === 'All' ? true : r.status === status))
      .filter((r) => (org === 'All' ? true : r.org === org))
  }, [invoices, q, type, status, org])

  const orgs = useMemo(() => {
    const set = new Set(invoices.map((i) => i.org))
    return ['All', ...Array.from(set)]
  }, [invoices])

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
      {/* Error Message */}
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="table-wrap mb-4">
          <TableSkeleton rows={8} cols={perms.viewAll ? 9 : 8} />
        </div>
      )}

      {/* Summary Stats */}
      {isLoading ? (
        <StatGridSkeleton className="mb-4" />
      ) : (
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
      )}

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
      {!isLoading && (
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
                      <Link to={`/billing/invoices/${r.id}`} className="btn secondary">
                        View
                      </Link>
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
      )}
    </DashboardLayout>
  )
}

