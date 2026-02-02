import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { usePrivacyRequests } from '@/modules/compliance/useCompliance'
import { getErrorMessage } from '@/core/api/errors'
import { LoadingRow } from '@/ui/components/SkeletonCards'

type RequestType = 'Data Export' | 'Data Deletion' | 'Opt-out' | 'Access Request'
type RequestStatus = 'Pending' | 'Processing' | 'Completed' | 'Rejected'

/**
 * Privacy Requests Page - Admin feature
 */
export function PrivacyRequests() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'privacyRequests')

  const { data: requestsData = [], isLoading, error } = usePrivacyRequests()

  const requests = useMemo(() => {
    const raw = Array.isArray(requestsData) ? requestsData : (requestsData as any)?.data || []
    return raw.map((r: any) => ({
      id: r.id,
      requester: r.requester || r.requesterEmail || r.userEmail || '—',
      type: (r.type || 'Access Request') as RequestType,
      status: (r.status || 'Pending') as RequestStatus,
      submitted: r.submittedAt || r.createdAt || '—',
      dueDate: r.dueAt || r.dueDate || '—',
    }))
  }, [requestsData])

  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'All'>('All')

  const filtered = useMemo(() => {
    return requests.filter((r) => (statusFilter === 'All' ? true : r.status === statusFilter))
  }, [requests, statusFilter])

  const stats = {
    pending: requests.filter((r) => r.status === 'Pending').length,
    processing: requests.filter((r) => r.status === 'Processing').length,
    overdue: 0,
  }

  function statusColor(s: RequestStatus) {
    switch (s) {
      case 'Pending': return 'pending'
      case 'Processing': return 'bg-accent/20 text-accent'
      case 'Completed': return 'approved'
      case 'Rejected': return 'rejected'
    }
  }

  return (
    <DashboardLayout pageTitle="Privacy Requests">
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
        </div>
      )}
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card"><div className="text-xs text-muted">Pending</div><div className="text-xl font-bold text-warn">{stats.pending}</div></div>
        <div className="card"><div className="text-xs text-muted">Processing</div><div className="text-xl font-bold text-accent">{stats.processing}</div></div>
        <div className="card"><div className="text-xs text-muted">Overdue</div><div className="text-xl font-bold text-danger">{stats.overdue}</div></div>
      </div>

      {/* Filter */}
      <div className="card mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'All')} className="select">
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Requester</th>
              <th>Type</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Due Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <LoadingRow colSpan={7} />}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted">No privacy requests found.</td>
              </tr>
            )}
            {!isLoading && filtered.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold text-text">{r.id}</td>
                <td>{r.requester}</td>
                <td><span className="chip">{r.type}</span></td>
                <td><span className={`pill ${statusColor(r.status)}`}>{r.status}</span></td>
                <td className="text-sm">{r.submitted}</td>
                <td className="text-sm">{r.dueDate}</td>
                <td className="text-right">
                  <div className="inline-flex gap-2">
                    <button className="btn secondary" onClick={() => alert(`View ${r.id} (demo)`)}>View</button>
                    {perms.process && r.status === 'Pending' && (
                      <button className="btn secondary" onClick={() => alert(`Process ${r.id} (demo)`)}>Process</button>
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

