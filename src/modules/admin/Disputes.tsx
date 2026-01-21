import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type DisputeStatus = 'Open' | 'Under Review' | 'Resolved' | 'Escalated'
type DisputeType = 'Refund' | 'Chargeback' | 'Billing Error' | 'Service Complaint'

/**
 * Disputes Page
 */
export function Disputes() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'disputes')

  const mockDisputes = [
    { id: 'DSP-001', customer: 'John Doe', type: 'Refund' as DisputeType, amount: 45.00, status: 'Open' as DisputeStatus, opened: '2024-12-23', session: 'SES-4521' },
    { id: 'DSP-002', customer: 'Jane Smith', type: 'Chargeback' as DisputeType, amount: 120.00, status: 'Under Review' as DisputeStatus, opened: '2024-12-20', session: 'SES-4485' },
    { id: 'DSP-003', customer: 'Bob Wilson', type: 'Billing Error' as DisputeType, amount: 25.00, status: 'Resolved' as DisputeStatus, opened: '2024-12-15', session: 'SES-4320' },
    { id: 'DSP-004', customer: 'Alice Brown', type: 'Service Complaint' as DisputeType, amount: 0, status: 'Escalated' as DisputeStatus, opened: '2024-12-18', session: 'SES-4390' },
  ]

  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'All'>('All')

  const filtered = useMemo(() => {
    return mockDisputes.filter((d) => (statusFilter === 'All' ? true : d.status === statusFilter))
  }, [statusFilter])

  const stats = {
    open: mockDisputes.filter((d) => d.status === 'Open' || d.status === 'Under Review').length,
    totalAmount: mockDisputes.filter((d) => d.status !== 'Resolved').reduce((a, d) => a + d.amount, 0),
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
            {filtered.map((d) => (
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

