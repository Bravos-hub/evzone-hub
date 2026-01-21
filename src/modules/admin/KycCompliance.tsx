import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type KycStatus = 'Pending' | 'Approved' | 'Rejected' | 'Under Review'
type RiskLevel = 'Low' | 'Medium' | 'High'

/**
 * KYC & Compliance Page - Admin feature
 */
export function KycCompliance() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'kycCompliance')

  const mockCases = [
    { id: 'KYC-001', entity: 'Volt Mobility Ltd', type: 'Business', status: 'Pending' as KycStatus, risk: 'Low' as RiskLevel, submitted: '2024-12-20', documents: 5 },
    { id: 'KYC-002', entity: 'John Operator', type: 'Individual', status: 'Under Review' as KycStatus, risk: 'Medium' as RiskLevel, submitted: '2024-12-22', documents: 3 },
    { id: 'KYC-003', entity: 'GridCity Ltd', type: 'Business', status: 'Approved' as KycStatus, risk: 'Low' as RiskLevel, submitted: '2024-12-15', documents: 6 },
    { id: 'KYC-004', entity: 'SunRun Ops', type: 'Business', status: 'Rejected' as KycStatus, risk: 'High' as RiskLevel, submitted: '2024-12-10', documents: 2 },
  ]

  const [statusFilter, setStatusFilter] = useState<KycStatus | 'All'>('All')

  const filtered = useMemo(() => {
    return mockCases.filter((c) => (statusFilter === 'All' ? true : c.status === statusFilter))
  }, [statusFilter])

  const stats = {
    pending: mockCases.filter((c) => c.status === 'Pending' || c.status === 'Under Review').length,
    approved: mockCases.filter((c) => c.status === 'Approved').length,
    highRisk: mockCases.filter((c) => c.risk === 'High').length,
  }

  function statusColor(s: KycStatus) {
    switch (s) {
      case 'Pending': return 'pending'
      case 'Under Review': return 'bg-accent/20 text-accent'
      case 'Approved': return 'approved'
      case 'Rejected': return 'rejected'
    }
  }

  function riskColor(r: RiskLevel) {
    switch (r) {
      case 'Low': return 'bg-ok/20 text-ok'
      case 'Medium': return 'bg-warn/20 text-warn'
      case 'High': return 'bg-danger/20 text-danger'
    }
  }

  return (
    <DashboardLayout pageTitle="KYC & Compliance">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Pending Review</div>
          <div className="text-xl font-bold text-warn">{stats.pending}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Approved</div>
          <div className="text-xl font-bold text-ok">{stats.approved}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">High Risk</div>
          <div className="text-xl font-bold text-danger">{stats.highRisk}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as KycStatus | 'All')} className="select">
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Cases Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Entity</th>
              <th>Type</th>
              <th>Risk</th>
              <th>Documents</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold text-text">{c.id}</td>
                <td>{c.entity}</td>
                <td><span className="chip">{c.type}</span></td>
                <td><span className={`pill ${riskColor(c.risk)}`}>{c.risk}</span></td>
                <td>{c.documents}</td>
                <td><span className={`pill ${statusColor(c.status)}`}>{c.status}</span></td>
                <td className="text-right">
                  <div className="inline-flex gap-2">
                    <button className="btn secondary" onClick={() => alert(`Review ${c.id} (demo)`)}>Review</button>
                    {perms.approve && c.status === 'Pending' && (
                      <button className="btn" style={{ background: '#03cd8c', color: 'white' }} onClick={() => alert(`Approve ${c.id} (demo)`)}>Approve</button>
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

