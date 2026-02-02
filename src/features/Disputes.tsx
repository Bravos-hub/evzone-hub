import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useDisputes } from '@/modules/finance/disputes/useDisputes'
import { getErrorMessage } from '@/core/api/errors'

type DisputeStatus = 'Open' | 'Under Review' | 'Resolved' | 'Escalated'
type DisputeType = 'Refund' | 'Chargeback' | 'Billing Error' | 'Service Complaint'

const mapStatus = (status?: string): DisputeStatus => {
  switch ((status || '').toLowerCase()) {
    case 'open':
      return 'Open'
    case 'under_review':
    case 'under review':
      return 'Under Review'
    case 'resolved':
      return 'Resolved'
    case 'escalated':
      return 'Escalated'
    default:
      return 'Open'
  }
}

const mapType = (type?: string): DisputeType => {
  switch ((type || '').toLowerCase()) {
    case 'chargeback':
      return 'Chargeback'
    case 'billing error':
    case 'billing_error':
      return 'Billing Error'
    case 'service complaint':
    case 'service_complaint':
      return 'Service Complaint'
    case 'refund':
    default:
      return 'Refund'
  }
}

/**
 * Disputes Page
 */
export function Disputes() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'disputes')

  const { data: disputesData = [], isLoading, error } = useDisputes()

  const disputes = useMemo(() => {
    const raw = Array.isArray(disputesData) ? disputesData : (disputesData as any)?.data || []
    return raw.map((d: any) => ({
      id: d.id,
      customer: d.customer || d.customerName || d.userName || '—',
      type: mapType(d.type),
      amount: d.amount ?? 0,
      status: mapStatus(d.status),
      opened: d.openedAt || d.createdAt || '—',
      session: d.sessionId || d.session || '—',
    }))
  }, [disputesData])

  
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'All'>('All')

  const filtered = useMemo(() => {
    return disputes.filter((d) => (statusFilter === 'All' ? true : d.status === statusFilter))
  }, [disputes, statusFilter])

  const stats = {
    open: disputes.filter((d) => d.status === 'Open' || d.status === 'Under Review').length,
    totalAmount: disputes.filter((d) => d.status !== 'Resolved').reduce((a, d) => a + d.amount, 0),
  }

  function statusColor(s: DisputeStatus) {
    switch (s) {
      case 'Open': return 'pending'
      case 'Under Review': return 'bg-accent/20 text-accent'
      case 'Resolved': return 'approved'
      case 'Escalated': return 'rejected'
    }
  }

  return (
    <DashboardLayout pageTitle="Disputes & Refunds">
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
        </div>
      )}
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Open Cases</div>
          <div className="text-xl font-bold text-warn">{stats.open}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Amount at Risk</div>
          <div className="text-xl font-bold text-danger">${stats.totalAmount.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Resolved This Month</div>
          <div className="text-xl font-bold text-ok">12</div>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | 'All')} className="select">
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Escalated">Escalated</option>
        </select>
      </div>

      {/* Disputes Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Session</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">Loading disputes...</td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">No disputes found.</td>
              </tr>
            )}
            {!isLoading && filtered.map((d) => (
              <tr key={d.id}>
                <td className="font-semibold text-text">{d.id}</td>
                <td>{d.customer}</td>
                <td><span className="chip">{d.type}</span></td>
                <td className="font-semibold">{d.amount > 0 ? `$${d.amount.toFixed(2)}` : '—'}</td>
                <td className="text-sm text-muted">{d.session}</td>
                <td><span className={`pill ${statusColor(d.status)}`}>{d.status}</span></td>
                <td className="text-right">
                  <div className="inline-flex gap-2">
                    <button className="btn secondary" onClick={() => alert(`View ${d.id} (demo)`)}>View</button>
                    {perms.resolve && d.status === 'Open' && (
                      <button className="btn" style={{ background: '#03cd8c', color: 'white' }} onClick={() => alert(`Resolve ${d.id} (demo)`)}>Resolve</button>
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

