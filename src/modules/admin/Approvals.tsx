import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/core/auth/types'
import { useApprovals, useApproveKyc, useRejectKyc, useApproveApplication, useRejectApplication } from '@/modules/approvals/hooks/useApprovals'
import type { ApprovalType } from '@/modules/approvals/services/approvalsService'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * Approvals Page - For onboarding approvals
 * 
 * RBAC Controls:
 * - viewAll: ADMIN, OPERATOR
 * - approve: ADMIN, OPERATOR
 * - reject: ADMIN, OPERATOR
 */
export function Approvals() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'approvals')

  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'All'>('All')
  const [openId, setOpenId] = useState<string | null>(null)

  // Fetch approvals from API
  const { data: approvals, isLoading, error } = useApprovals({
    type: typeFilter === 'All' ? undefined : typeFilter,
  })

  // Mutations
  const approveKycMutation = useApproveKyc()
  const rejectKycMutation = useRejectKyc()
  const approveAppMutation = useApproveApplication()
  const rejectAppMutation = useRejectApplication()

  const filtered = useMemo(() => {
    if (!approvals) return []
    return approvals.filter((r) =>
      q ? (r.id + ' ' + r.applicantName + ' ' + r.details?.email || '').toLowerCase().includes(q.toLowerCase()) : true
    )
  }, [approvals, q])

  const stats = useMemo(() => ({
    total: filtered.length,
    pending: approvals?.filter((r) => r.status === 'PENDING').length || 0,
    kyc: approvals?.filter((r) => r.type === 'KYC').length || 0,
  }), [filtered, approvals])

  const openRow = approvals?.find((r) => r.id === openId) || null

  function statusColor(s: ApprovalStatus) {
    switch (s) {
      case 'PENDING': return 'pending'
      case 'APPROVED': return 'approved'
      case 'REJECTED': return 'rejected'
    }
  }

  async function handleAction(item: typeof openRow, action: 'approve' | 'reject') {
    if (!item || !user) return

    try {
      if (item.type === 'KYC') {
        if (action === 'approve') {
          await approveKycMutation.mutateAsync({
            userId: item.applicantId,
            reviewedBy: user.id,
            notes: 'Approved via dashboard',
          })
        } else {
          await rejectKycMutation.mutateAsync({
            userId: item.applicantId,
            reviewedBy: user.id,
            notes: 'Rejected via dashboard',
          })
        }
      } else if (item.type === 'TENANT_APPLICATION' && item.resourceId) {
        if (action === 'approve') {
          await approveAppMutation.mutateAsync({
            applicationId: item.resourceId,
            reviewedBy: user.id,
            notes: 'Approved via dashboard',
          })
        } else {
          await rejectAppMutation.mutateAsync({
            applicationId: item.resourceId,
            reviewedBy: user.id,
            notes: 'Rejected via dashboard',
          })
        }
      }
      setOpenId(null)
    } catch (err) {
      console.error('Failed to process approval:', err)
      alert(`Failed to ${action} approval`)
    }
  }

  return (
    <DashboardLayout pageTitle="Onboarding Approvals">
      {/* Loading/Error States */}
      {isLoading && (
        <div className="py-8">
          <TextSkeleton lines={2} centered />
        </div>
      )}
      {error && <div className="text-center py-8 text-danger">Error loading approvals: {error.message}</div>}

      {!isLoading && !error && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card">
              <div className="text-xs text-muted">Total Applications</div>
              <div className="text-xl font-bold text-text">{stats.total}</div>
            </div>
            <div className="card">
              <div className="text-xs text-muted">Pending Review</div>
              <div className="text-xl font-bold text-warn">{stats.pending}</div>
            </div>
            <div className="card">
              <div className="text-xs text-muted">KYC Verifications</div>
              <div className="text-xl font-bold text-accent">{stats.kyc}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search approvals"
                className="input col-span-2 xl:col-span-1"
              />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ApprovalType | 'All')} className="select">
                <option value="All">All Types</option>
                <option value="KYC">KYC Verification</option>
                <option value="TENANT_APPLICATION">Tenant Application</option>
                <option value="ACCESS_REQUEST">Access Request</option>
                <option value="DOCUMENT_VERIFICATION">Document Verification</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-32">ID</th>
                  <th className="w-32">Type</th>
                  <th className="w-48">Applicant</th>
                  <th className="w-24">Submitted</th>
                  <th className="w-24">Status</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold whitespace-nowrap">{r.id}</td>
                    <td className="whitespace-nowrap">{r.type}</td>
                    <td className="truncate max-w-[192px]">
                      <div className="truncate" title={r.applicantName}>{r.applicantName}</div>
                      <div className="text-xs text-muted truncate" title={r.details?.email}>{r.details?.email || '—'}</div>
                    </td>
                    <td className="text-sm whitespace-nowrap">{new Date(r.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`pill ${statusColor(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <button className="btn secondary" onClick={() => setOpenId(r.id)}>
                          Review
                        </button>
                        {perms.approve && r.status === 'PENDING' && (
                          <button className="btn" style={{ background: '#03cd8c', color: 'white' }} onClick={() => handleAction(r, 'approve')}>
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Review Drawer */}
      {openRow && (
        <ReviewDrawer
          approval={openRow}
          onClose={() => setOpenId(null)}
          onApprove={() => handleAction(openRow, 'approve')}
          onReject={() => handleAction(openRow, 'reject')}
          perms={perms}
        />
      )}
    </DashboardLayout>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAWER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ReviewDrawer({
  approval,
  onClose,
  onApprove,
  onReject,
  perms,
}: {
  approval: import('@/modules/approvals/services/approvalsService').ApprovalItem
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  perms: Record<string, boolean>
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-panel border-l border-border-light shadow-xl p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text">Approval {approval.id}</h3>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="panel">
            <div className="text-xs text-muted">Type</div>
            <div className="font-semibold">{approval.type}</div>
          </div>
          <div className="panel">
            <div className="text-xs text-muted">Status</div>
            <div className="font-semibold">{approval.status}</div>
          </div>
          <div className="panel col-span-2">
            <div className="text-xs text-muted">Applicant</div>
            <div className="font-semibold">{approval.applicantName}</div>
          </div>
          {approval.details?.email && (
            <div className="panel col-span-2">
              <div className="text-xs text-muted">Email</div>
              <div className="font-semibold">{approval.details.email}</div>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="text-xs text-muted mb-2">Details</div>
          <pre className="text-sm bg-surface p-3 rounded overflow-auto max-h-64">
            {JSON.stringify(approval.details, null, 2)}
          </pre>
        </div>

        {approval.reviewNotes && (
          <div className="panel">
            <div className="text-xs text-muted mb-1">Review Notes</div>
            <div className="text-sm">{approval.reviewNotes}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {perms.approve && approval.status === 'PENDING' && (
            <button className="btn" style={{ background: '#03cd8c', color: 'white' }} onClick={onApprove}>
              Approve
            </button>
          )}
          {perms.reject && approval.status === 'PENDING' && (
            <button className="btn danger" onClick={onReject}>
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


