import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { DispatchModal, type DispatchFormData } from '@/modals/DispatchModal'
import { DispatchDetailModal } from '@/modals/DispatchDetailModal'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type DispatchStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'
type Priority = 'Critical' | 'High' | 'Normal' | 'Low'

type Dispatch = {
  id: string
  title: string
  description: string
  status: DispatchStatus
  priority: Priority
  stationId: string
  stationName: string
  stationAddress: string
  stationChargers: number
  ownerName: string
  ownerContact: string
  assignee: string
  assigneeContact: string
  createdAt: string
  createdBy: string
  dueAt: string
  estimatedDuration: string
  incidentId?: string
  requiredSkills: string[]
  notes?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockDispatches: Dispatch[] = [
  {
    id: 'DSP-001',
    title: 'Connector replacement - Bay 3',
    description: 'The connector on Bay 3 is damaged and needs immediate replacement. Customer reported difficulty connecting vehicle. Replacement connector is available in stock.',
    status: 'Assigned',
    priority: 'High',
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
    dueAt: '2024-12-24 14:00',
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
    dueAt: '2024-12-26 18:00',
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
    dueAt: '2024-12-24 12:00',
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
    dueAt: '2024-12-20 17:00',
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
  const [priority, setPriority] = useState<Priority | 'All'>('All')
  const [dispatches, setDispatches] = useState<Dispatch[]>(mockDispatches)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null)
  const [ack, setAck] = useState('')

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

  function priorityColor(p: Priority) {
    switch (p) {
      case 'Critical': return 'bg-danger text-white'
      case 'High': return 'bg-warn text-white'
      case 'Normal': return 'bg-muted/30 text-muted'
      case 'Low': return 'bg-muted/20 text-muted'
    }
  }

  const handleCreateDispatch = (formData: DispatchFormData) => {
    const newDispatch: Dispatch = {
      id: `DSP-${String(dispatches.length + 1).padStart(3, '0')}`,
      title: formData.title,
      description: formData.description,
      status: 'Assigned',
      priority: formData.priority,
      stationId: formData.stationId,
      stationName: 'New Station', // In real app, lookup from station ID
      stationAddress: 'Address from API',
      stationChargers: 8,
      ownerName: 'Owner Name',
      ownerContact: '+256 700 000 000',
      assignee: 'Technician Name', // In real app, lookup from technician ID
      assigneeContact: '+256 701 000 000',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      createdBy: user?.name || 'Admin',
      dueAt: `${formData.dueDate} ${formData.dueTime}`,
      estimatedDuration: formData.estimatedDuration,
      incidentId: formData.incidentId,
      requiredSkills: formData.requiredSkills,
    }
    setDispatches([newDispatch, ...dispatches])
    toast(`Dispatch ${newDispatch.id} created and assigned successfully`)
  }

  const handleStatusChange = (dispatchId: string, newStatus: DispatchStatus, notes?: string) => {
    setDispatches(dispatches.map(d => 
      d.id === dispatchId 
        ? { ...d, status: newStatus, notes: notes || d.notes }
        : d
    ))
    toast(`Dispatch ${dispatchId} updated to ${newStatus}`)
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
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | 'All')} className="select">
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
                <td className="text-sm whitespace-nowrap">{r.dueAt}</td>
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

