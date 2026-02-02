import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useApprovals } from '@/modules/approvals/hooks/useApprovals'
import { getErrorMessage } from '@/core/api/errors'

type KycStatus = 'Pending' | 'Approved' | 'Rejected' | 'Under Review'
type RiskLevel = 'Low' | 'Medium' | 'High'

/**
 * KYC & Compliance Page - Admin feature
 */
export function KycCompliance() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'kycCompliance')

  const { data: approvals = [], isLoading, error } = useApprovals({ type: 'KYC' })

  const cases = useMemo(() => {
    return approvals.map((item) => ({
      id: item.id,
      entity: item.applicantName || item.details?.entity || item.details?.organizationName || 'Unknown',
      type: item.details?.entityType || item.details?.type || 'Business',
      status: (item.status === 'PENDING'
        ? 'Pending'
        : item.status === 'APPROVED'
          ? 'Approved'
          : item.status === 'REJECTED'
            ? 'Rejected'
            : 'Under Review') as KycStatus,
      risk: (item.details?.riskLevel || item.details?.risk || 'Low') as RiskLevel,
      submitted: item.submittedAt,
      documents: Array.isArray(item.details?.documents)
        ? item.details.documents.length
        : Array.isArray(item.details?.docs)
          ? item.details.docs.length
          : 0,
    }))
  }, [approvals])

  const [statusFilter, setStatusFilter] = useState<KycStatus | 'All'>('All')

  const filtered = useMemo(() => {
    return cases.filter((c) => (statusFilter === 'All' ? true : c.status === statusFilter))
  }, [cases, statusFilter])

  const stats = {
    pending: cases.filter((c) => c.status === 'Pending' || c.status === 'Under Review').length,
    approved: cases.filter((c) => c.status === 'Approved').length,
    highRisk: cases.filter((c) => c.risk === 'High').length,
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
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
        </div>
      )}
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
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  Loading KYC cases...
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">
                  No KYC cases found.
                </td>
              </tr>
            )}
            {!isLoading && filtered.map((c) => (
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

