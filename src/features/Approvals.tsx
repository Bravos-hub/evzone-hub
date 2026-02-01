import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useApprovals, useApproveApplication, useRejectApplication, useApproveKyc, useRejectKyc } from '@/modules/approvals/hooks/useApprovals'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/core/auth/types'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'SendBack'

type Application = {
  id: string
  role: Role
  org: string
  contact: string
  email: string
  country: string
  site: string
  plan: string
  submittedAt: string
  status: ApprovalStatus
  notes: string
  docs: Array<{ id: string; name: string; type: string; url: string }>
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════


// Mock data removed in favor of verify hooks

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

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

  /* 
   * INTEGRATED HOOKS
   */
  const { data: approvalItems = [], isLoading } = useApprovals({
    type: undefined // Fetch all types
  })

  const approveMutation = useApproveApplication()
  const rejectMutation = useRejectApplication() // We might need specific hooks per type, but let's assume Application hook covers general requests for now or we map it.
  // Actually, useApprovals returns different types.
  // If type is KYC, use useApproveKyc. If APPLICATION, use useApproveApplication.
  const approveKycMutation = useApproveKyc()
  const rejectKycMutation = useRejectKyc()

  // Map API data to UI format
  // We assume 'details' contains the application specific fields
  const rows = useMemo(() => {
    return approvalItems.map(item => ({
      id: item.id,
      role: (item.details?.role || 'STATION_OWNER') as Role,
      org: item.details?.org || '—',
      contact: item.applicantName || item.details?.contact || 'Unknown',
      email: item.details?.email || '—',
      country: item.details?.country || '—',
      site: item.details?.site || '—',
      plan: item.details?.plan || '—',
      submittedAt: new Date(item.submittedAt).toLocaleString(),
      status: (item.status === 'PENDING' ? 'Pending' : item.status === 'APPROVED' ? 'Approved' : 'Rejected') as ApprovalStatus, // Map backend UPPERCASE to Title Case
      notes: item.reviewNotes || '',
      docs: item.details?.docs || [],
      originalType: item.type, // Keep track for actions
      applicantId: item.applicantId
    }))
  }, [approvalItems])

  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'All'>('Pending')
  const [openId, setOpenId] = useState<string | null>(null)

  // Remove manual useEffect for mock data

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (q ? (r.id + ' ' + r.org + ' ' + r.contact + ' ' + r.email).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (roleFilter === 'All' ? true : r.role === roleFilter))
      .filter((r) => (statusFilter === 'All' ? true : r.status === statusFilter))
  }, [rows, q, roleFilter, statusFilter])

  const stats = useMemo(() => ({
    total: filtered.length,
    pending: rows.filter((r) => r.status === 'Pending').length,
    sendBack: rows.filter((r) => r.status === 'SendBack').length,
  }), [filtered, rows])

  const openRow = rows.find((r) => r.id === openId) || null

  function statusColor(s: ApprovalStatus) {
    switch (s) {
      case 'Pending': return 'pending'
      case 'Approved': return 'approved'
      case 'Rejected': return 'rejected'
      case 'SendBack': return 'sendback'
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject' | 'sendback') {
    const row = rows.find(r => r.id === id);
    if (!row) return;

    try {
      if (row.originalType === 'KYC') {
        if (action === 'approve') await approveKycMutation.mutateAsync({ userId: row.applicantId, reviewedBy: user?.id || 'Admin' });
        else if (action === 'reject') await rejectKycMutation.mutateAsync({ userId: row.applicantId, reviewedBy: user?.id || 'Admin', notes: 'Rejected via dashboard' });
      } else {
        // Default to Application
        if (action === 'approve') await approveMutation.mutateAsync({ applicationId: id, reviewedBy: user?.id || 'Admin' });
        else if (action === 'reject') await rejectMutation.mutateAsync({ applicationId: id, reviewedBy: user?.id || 'Admin', notes: 'Rejected via dashboard' });
      }
      setOpenId(null)
    } catch (e) {
      console.error("Action failed", e);
      alert("Failed to update status");
    }
  }

  return (
    <DashboardLayout pageTitle="Onboarding Approvals">
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
          <div className="text-xs text-muted">Sent Back</div>
          <div className="text-xl font-bold text-accent">{stats.sendBack}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search applications"
            className="input col-span-2 xl:col-span-1"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | 'All')} className="select">
            <option value="All">All Roles</option>
            <option value="STATION_OWNER">{ROLE_LABELS.STATION_OWNER}</option>
            <option value="EVZONE_OPERATOR">{ROLE_LABELS.EVZONE_OPERATOR}</option>
            <option value="SITE_OWNER">{ROLE_LABELS.SITE_OWNER}</option>
            <option value="TECHNICIAN_PUBLIC">{ROLE_LABELS.TECHNICIAN_PUBLIC}</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'All')} className="select">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="SendBack">Send Back</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="w-24">ID</th>
              <th className="w-24">Role</th>
              <th className="w-32">Organization</th>
              <th className="w-48">Contact</th>
              <th className="w-24">Submitted</th>
              <th className="w-24">Status</th>
              <th className="w-16">Docs</th>
              <th className="!text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold whitespace-nowrap">{r.id}</td>
                <td className="whitespace-nowrap">{ROLE_LABELS[r.role]}</td>
                <td className="truncate max-w-[128px]" title={r.org}>{r.org}</td>
                <td className="truncate max-w-[192px]">
                  <div className="truncate" title={r.contact}>{r.contact}</div>
                  <div className="text-xs text-muted truncate" title={r.email}>{r.email}</div>
                </td>
                <td className="text-sm whitespace-nowrap">{r.submittedAt}</td>
                <td>
                  <span className={`pill ${statusColor(r.status)}`}>{r.status}</span>
                </td>
                <td>{r.docs.length}</td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button className="btn secondary" onClick={() => setOpenId(r.id)}>
                      Review
                    </button>
                    {perms.approve && r.status === 'Pending' && (
                      <button className="btn" style={{ background: '#03cd8c', color: 'white' }} onClick={() => handleAction(r.id, 'approve')}>
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

      {/* Review Drawer */}
      {openRow && (
        <ReviewDrawer
          application={openRow}
          onClose={() => setOpenId(null)}
          onApprove={() => handleAction(openRow.id, 'approve')}
          onReject={() => handleAction(openRow.id, 'reject')}
          onSendBack={() => handleAction(openRow.id, 'sendback')}
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
  application,
  onClose,
  onApprove,
  onReject,
  onSendBack,
  perms,
}: {
  application: Application
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onSendBack: () => void
  perms: Record<string, boolean>
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-panel border-l border-border-light shadow-xl p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text">Application {application.id}</h3>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="panel">
            <div className="text-xs text-muted">Role</div>
            <div className="font-semibold">{ROLE_LABELS[application.role]}</div>
          </div>
          <div className="panel">
            <div className="text-xs text-muted">Plan</div>
            <div className="font-semibold">{application.plan}</div>
          </div>
          <div className="panel">
            <div className="text-xs text-muted">Organization</div>
            <div className="font-semibold">{application.org}</div>
          </div>
          <div className="panel">
            <div className="text-xs text-muted">Contact</div>
            <div className="font-semibold">{application.contact}</div>
          </div>
          <div className="panel col-span-2">
            <div className="text-xs text-muted">Email</div>
            <div className="font-semibold">{application.email}</div>
          </div>
        </div>

        <div className="panel">
          <div className="text-xs text-muted mb-2">Documents ({application.docs.length})</div>
          {application.docs.length === 0 ? (
            <div className="text-sm text-muted">No documents attached</div>
          ) : (
            <ul className="space-y-1">
              {application.docs.map((d) => (
                <li key={d.id} className="text-sm">
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    {d.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {application.notes && (
          <div className="panel">
            <div className="text-xs text-muted mb-1">Notes</div>
            <div className="text-sm">{application.notes}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {perms.approve && (
            <button className="btn" style={{ background: '#03cd8c', color: 'white' }} onClick={onApprove}>
              Approve
            </button>
          )}
          {perms.reject && (
            <>
              <button className="btn secondary" onClick={onSendBack}>
                Send Back
              </button>
              <button className="btn danger" onClick={onReject}>
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


