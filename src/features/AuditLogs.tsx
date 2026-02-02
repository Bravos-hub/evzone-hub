import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useAuditLogs } from '@/modules/audit/hooks/useAuditLogs'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Audit Logs Page - Admin only
 */
export function AuditLogs() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'auditLogs')

  const [q, setQ] = useState('')
  const [resource, setResource] = useState<string>('All')
  const [action, setAction] = useState<string>('All')
  const [page, setPage] = useState(1)

  // Fetch audit logs from API
  const { data: auditData, isLoading, error } = useAuditLogs({
    resource: resource === 'All' ? undefined : resource,
    action: action === 'All' ? undefined : action,
    page,
    limit: 50,
  })

  const filtered = useMemo(() => {
    if (!auditData?.data) return []
    return auditData.data.filter((r) =>
      q ? (r.actor + ' ' + r.action + ' ' + r.resource + ' ' + (r.details?.toString() || '')).toLowerCase().includes(q.toLowerCase()) : true
    )
  }, [auditData, q])

  function statusColor(s: string) {
    switch (s) {
      case 'SUCCESS': return 'bg-success/20 text-success'
      case 'FAILURE': return 'bg-danger/20 text-danger'
      default: return 'bg-muted/30 text-muted'
    }
  }

  return (
    <DashboardLayout pageTitle="Audit Logs">
      {/* Loading/Error States */}
      {isLoading && (
        <div className="py-8">
          <TextSkeleton lines={2} centered />
        </div>
      )}
      {error && <div className="text-center py-8 text-danger">Error loading audit logs: {error.message}</div>}

      {!isLoading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card">
              <div className="text-xs text-muted">Total Logs</div>
              <div className="text-xl font-bold text-text">{auditData?.pagination.total || 0}</div>
            </div>
            <div className="card">
              <div className="text-xs text-muted">Current Page</div>
              <div className="text-xl font-bold text-text">{page} / {auditData?.pagination.totalPages || 1}</div>
            </div>
            <div className="card">
              <div className="text-xs text-muted">Showing</div>
              <div className="text-xl font-bold text-text">{filtered.length} logs</div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search logs"
                className="input col-span-2 xl:col-span-1"
              />
              <select value={resource} onChange={(e) => setResource(e.target.value)} className="select">
                <option value="All">All Resources</option>
                <option value="User">User</option>
                <option value="Station">Station</option>
                <option value="Plan">Subscription Plan</option>
                <option value="Session">Session</option>
                <option value="Billing">Billing</option>
                <option value="System">System</option>
              </select>
              <select value={action} onChange={(e) => setAction(e.target.value)} className="select">
                <option value="All">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          {perms.export && (
            <div className="flex items-center gap-2 mb-4">
              <button className="btn secondary" onClick={() => alert('Export audit logs (API integration pending)')}>
                Export
              </button>
            </div>
          )}

          {/* Logs Table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Resource</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="text-sm text-muted whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div className="font-medium">{r.actorName || r.actor}</div>
                      <div className="text-xs text-muted">{r.actor}</div>
                    </td>
                    <td><span className="chip">{r.resource}</span></td>
                    <td className="font-medium">{r.action}</td>
                    <td className="text-sm text-muted max-w-[200px] truncate">
                      {r.resourceId || JSON.stringify(r.details)}
                    </td>
                    <td className="text-sm text-muted">{r.ipAddress || '—'}</td>
                    <td>
                      <span className={`pill ${statusColor(r.status)}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {auditData && auditData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                className="btn secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {page} of {auditData.pagination.totalPages}
              </span>
              <button
                className="btn secondary"
                disabled={page === auditData.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

