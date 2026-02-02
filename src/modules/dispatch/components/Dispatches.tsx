import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { DispatchModal, type DispatchFormData } from '@/modals/DispatchModal'
import { DispatchDetailModal } from '../modals/DispatchDetailModal'
import { useDispatches, useCreateDispatch, useAssignDispatch, useUpdateDispatch } from '@/modules/dispatch/hooks/useDispatches'
import { getErrorMessage } from '@/core/api/errors'
import { auditLogger } from '@/core/utils/auditLogger'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

import { Dispatch, DispatchStatus, DispatchPriority } from '@/core/api/types'

// Local type for UI state if needed, or just use Dispatch
// If we need to enforce required fields for the UI that are optional in API, we can use a utility type
// But for now, let's try to use the core Dispatch type directly.


// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dispatches Page - Unified for all roles
 * 
 * RBAC Controls:
 * - viewAll: ADMIN, OPERATOR see all dispatches
 * - create: ADMIN, OPERATOR can create
 * - assign: ADMIN, OPERATOR can assign
 * - accept/complete: TECHNICIANS can accept and complete
 */
export function Dispatches() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'dispatches')

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<DispatchStatus | 'All'>('All')
  const [priority, setPriority] = useState<DispatchPriority | 'All'>('All')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null)
  const [ack, setAck] = useState('')

  const { data: dispatchesData, isLoading, error } = useDispatches({
    status: status !== 'All' ? status : undefined,
    priority: priority !== 'All' ? priority : undefined,
  })
  const createDispatchMutation = useCreateDispatch()
  const assignDispatchMutation = useAssignDispatch()
  const updateDispatchMutation = useUpdateDispatch()

  // Map API dispatches to display format
  const dispatches = useMemo(() => {
    if (!dispatchesData) return []
    return dispatchesData.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      status: d.status as DispatchStatus,
      priority: d.priority as DispatchPriority,
      stationId: d.stationId,
      stationName: d.stationName || 'Unknown Station',
      stationAddress: d.stationAddress || 'Unknown Address',
      stationChargers: d.stationChargers || 0,
      ownerName: d.ownerName || 'Unknown Owner',
      ownerContact: d.ownerContact || '',
      assignee: d.assignee || 'Unassigned',
      assigneeContact: d.assigneeContact || '',
      created: d.createdAt, // Maintain compatibility if used
      createdAt: d.createdAt,
      createdBy: d.createdBy || 'System',
      dueDate: d.dueDate || d.dueAt || '',
      updatedAt: d.updatedAt || new Date().toISOString(),
      estimatedDuration: d.estimatedDuration,
      incidentId: d.incidentId,
      requiredSkills: d.requiredSkills,
      notes: d.notes,
    }))
  }, [dispatchesData])

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 3000) }

  const filtered = useMemo(() => {
    return dispatches
      .filter((r) => (q ? (r.id + ' ' + r.title + ' ' + r.stationName).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (status === 'All' ? true : r.status === status))
      .filter((r) => (priority === 'All' ? true : r.priority === priority))
  }, [dispatches, q, status, priority])

  const stats = useMemo(() => ({
    total: filtered.length,
    pending: filtered.filter((r) => r.status === 'Pending').length,
    inProgress: filtered.filter((r) => r.status === 'In Progress').length,
    completed: filtered.filter((r) => r.status === 'Completed').length,
  }), [filtered])

  function statusColor(s: DispatchStatus) {
    switch (s) {
      case 'Pending': return 'pending'
      case 'Assigned': return 'sendback'
      case 'In Progress': return 'bg-accent/20 text-accent'
      case 'Completed': return 'approved'
      case 'Cancelled': return 'rejected'
    }
  }

  function priorityColor(p: DispatchPriority) {
    switch (p) {
      case 'Critical': return 'bg-danger text-white'
      case 'High': return 'bg-warn text-white'
      case 'Normal': return 'bg-muted/30 text-muted'
      case 'Low': return 'bg-muted/20 text-muted'
    }
  }

  const handleCreateDispatch = async (formData: DispatchFormData) => {
    try {
      const newDispatch = await createDispatchMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        stationId: formData.stationId,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        estimatedDuration: formData.estimatedDuration,
        incidentId: formData.incidentId,
        requiredSkills: formData.requiredSkills,
      })
      auditLogger.dispatchCreated(newDispatch.id, newDispatch.title)

      // Assign dispatch if technician is selected
      if (formData.technicianId) {
        try {
          await assignDispatchMutation.mutateAsync({
            id: newDispatch.id,
            data: {
              assignee: formData.technicianId,
              assigneeContact: '', // Would be fetched from user data
            },
          })
          auditLogger.dispatchAssigned(newDispatch.id, formData.technicianId)
        } catch (err) {
          // Assignment failed but dispatch was created
          console.error('Failed to assign dispatch:', err)
        }
      }

      alert(`Dispatch ${newDispatch.id} created${formData.technicianId ? ' and assigned' : ''} successfully`)
      setShowCreateModal(false)
    } catch (err) {
      alert(`Failed to create dispatch: ${getErrorMessage(err)}`)
    }
  }

  const handleStatusChange = async (dispatchId: string, newStatus: DispatchStatus, notes?: string) => {
    try {
      await updateDispatchMutation.mutateAsync({
        id: dispatchId,
        data: { status: newStatus, notes },
      })
      auditLogger.dispatchUpdated(dispatchId, `Status changed to ${newStatus}`)
      alert(`Dispatch ${dispatchId} updated to ${newStatus}`)
    } catch (err) {
      alert(`Failed to update dispatch: ${getErrorMessage(err)}`)
    }
  }

  const handleViewDispatch = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch)
    setShowDetailModal(true)
  }

  return (
    <DashboardLayout pageTitle="Dispatches">
      {ack && <div className="mb-4 rounded-lg bg-accent/10 text-accent px-4 py-3 text-sm font-medium">{ack}</div>}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total</div>
          <div className="text-xl font-bold text-text">{stats.total}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Pending</div>
          <div className="text-xl font-bold text-warn">{stats.pending}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">In Progress</div>
          <div className="text-xl font-bold text-accent">{stats.inProgress}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Completed</div>
          <div className="text-xl font-bold text-ok">{stats.completed}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dispatches"
            className="input col-span-2 xl:col-span-1"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value as DispatchStatus | 'All')} className="select">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as DispatchPriority | 'All')} className="select">
            <option value="All">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      {perms.create && (
        <div className="flex items-center gap-2 mb-4">
          <button className="btn secondary" onClick={() => setShowCreateModal(true)}>
            + New Dispatch
          </button>
        </div>
      )}

      {/* Dispatches Table */}
      {!isLoading && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="w-32">Dispatch</th>
                <th className="w-24">Priority</th>
                <th className="w-32">Station</th>
                <th className="w-24">Assignee</th>
                <th className="w-24">Status</th>
                <th className="w-24">Due</th>
                <th className="w-24 !text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="truncate max-w-[128px]">
                    <div className="font-semibold text-text">{r.id}</div>
                    <div className="text-xs text-muted truncate" title={r.title}>{r.title}</div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`pill ${priorityColor(r.priority)}`}>{r.priority}</span>
                  </td>
                  <td className="truncate max-w-[128px]">
                    <div className="truncate" title={r.stationName}>{r.stationName}</div>
                    <div className="text-xs text-muted truncate">{r.stationId}</div>
                  </td>
                  <td className="truncate max-w-[96px]" title={r.assignee}>{r.assignee}</td>
                  <td className="whitespace-nowrap">
                    <span className={`pill ${statusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="text-sm whitespace-nowrap">{r.dueDate}</td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <button className="btn secondary" onClick={() => handleViewDispatch(r)}>
                        View
                      </button>
                      {perms.assign && r.status === 'Pending' && (
                        <button className="btn secondary" onClick={() => handleViewDispatch(r)}>
                          Assign
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

      {/* Modals */}
      <DispatchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateDispatch}
        mode="create"
      />

      <DispatchDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        dispatch={selectedDispatch}
        onStatusChange={handleStatusChange}
      />
    </DashboardLayout>
  )
}

