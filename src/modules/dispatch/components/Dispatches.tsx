import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { DispatchModal, type DispatchFormData } from '@/modals/DispatchModal'
import { DispatchDetailModal } from '../modals/DispatchDetailModal'
import { useDispatches, useCreateDispatch, useAssignDispatch, useUpdateDispatch } from '@/modules/dispatch/hooks/useDispatches'
import { useStations } from '@/modules/stations/hooks/useStations'
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

const mockDispatches: Dispatch[] = [
  {
    id: 'DSP-001',
    title: 'Connector replacement - Bay 3',
    description: 'The connector on Bay 3 is damaged and needs immediate replacement. Customer reported difficulty connecting vehicle. Replacement connector is available in stock.',
    status: 'Assigned',
    priority: 'High' as DispatchPriority,
    stationId: 'ST-0001',
    stationName: 'Kampala CBD Hub',
    stationAddress: 'Plot 12, Kampala Road, Kampala',
    stationChargers: 8,
    ownerName: 'John Ssemakula',
    ownerContact: '+256 700 123 456',
    assignee: 'Allan Tech',
    assigneeContact: '+256 701 111 111',
    createdAt: '2024-12-24 08:00',
    createdBy: 'Manager James',
    dueDate: '2024-12-24 14:00',
    updatedAt: '2024-12-24 09:00',
    estimatedDuration: '2h',
    incidentId: 'INC-2392',
    requiredSkills: ['OCPP', 'Electrical'],
  },
  {
    id: 'DSP-002',
    title: 'Firmware update - All chargers',
    description: 'All chargers at this station need firmware update to version 2.1.5 to fix communication issues with certain EV models.',
    status: 'Pending',
    priority: 'Normal',
    stationId: 'ST-0002',
    stationName: 'Entebbe Airport Lot',
    stationAddress: 'Entebbe International Airport, Entebbe',
    stationChargers: 12,
    ownerName: 'Sarah Namugga',
    ownerContact: '+256 700 234 567',
    assignee: 'Unassigned',
    assigneeContact: '',
    createdAt: '2024-12-23 16:00',
    createdBy: 'Operator David',
    dueDate: '2024-12-26 18:00',
    updatedAt: '2024-12-23 17:00',
    estimatedDuration: '4h',
    requiredSkills: ['Firmware', 'OCPP'],
  },
  {
    id: 'DSP-003',
    title: 'Swap bay door repair',
    description: 'Automated door mechanism on swap bay 2 is malfunctioning. Door fails to close properly after battery swap completion.',
    status: 'In Progress',
    priority: 'Critical',
    stationId: 'ST-0017',
    stationName: 'Gulu Main Street',
    stationAddress: 'Churchill Drive, Gulu',
    stationChargers: 6,
    ownerName: 'Peter Okello',
    ownerContact: '+256 700 345 678',
    assignee: 'Tech Team B',
    assigneeContact: '+256 701 222 222',
    createdAt: '2024-12-22 10:00',
    createdBy: 'Admin Mary',
    dueDate: '2024-12-24 12:00',
    updatedAt: '2024-12-22 11:00',
    estimatedDuration: '4h',
    incidentId: 'INC-2384',
    requiredSkills: ['Mechanical', 'Swap Station'],
  },
  {
    id: 'DSP-004',
    title: 'Preventive maintenance check',
    description: 'Quarterly preventive maintenance inspection for all charging equipment. Check connections, cooling systems, and test charge cycles.',
    status: 'Completed',
    priority: 'Low',
    stationId: 'ST-1011',
    stationName: 'Berlin Mitte Garage',
    stationAddress: 'Mitte District, Berlin',
    stationChargers: 4,
    ownerName: 'Klaus Schmidt',
    ownerContact: '+49 30 12345678',
    assignee: 'Local Contractor',
    assigneeContact: '+49 30 98765432',
    createdAt: '2024-12-20 09:00',
    createdBy: 'Manager Anna',
    dueDate: '2024-12-20 17:00',
    updatedAt: '2024-12-20 17:00',
    estimatedDuration: '2h',
    requiredSkills: ['Maintenance', 'Electrical'],
    notes: 'All systems checked and functioning properly. Next maintenance due in 3 months.',
  },
]

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
  const { data: stationsData } = useStations()
  const stations = stationsData || []

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

