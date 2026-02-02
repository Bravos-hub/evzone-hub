import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useDispatches, useCreateDispatch } from '@/modules/dispatch/hooks/useDispatches'
import { useStations } from '@/modules/stations/hooks/useStations'
import { getErrorMessage } from '@/core/api/errors'
import type { Dispatch } from '@/core/api/types'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

/* ─────────────────────────────────────────────────────────────────────────────
   Tech Requests — Technician service requests management
   RBAC: Owners, Station Admins (create/view), Technicians (view assigned)
───────────────────────────────────────────────────────────────────────────── */

type RequestStatus = 'Open' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'
type RequestPriority = 'Low' | 'Normal' | 'High' | 'Urgent'
type RequestType = 'Installation' | 'Repair' | 'Maintenance' | 'Inspection' | 'Commissioning'

interface TechRequest {
  id: string
  type: RequestType
  site: string
  charger?: string
  description: string
  priority: RequestPriority
  status: RequestStatus
  created: string
  scheduled?: string
  technician?: string
  estimatedCost?: number
}

type StationLite = {
  id: string
  name?: string
  code?: string
}

const inferType = (dispatch: Dispatch): RequestType => {
  const text = `${dispatch.title} ${dispatch.description || ''}`.toLowerCase()
  if (text.includes('install')) return 'Installation'
  if (text.includes('repair')) return 'Repair'
  if (text.includes('inspect')) return 'Inspection'
  if (text.includes('commission')) return 'Commissioning'
  return 'Maintenance'
}

const mapPriority = (priority?: string): RequestPriority => {
  switch ((priority || '').toLowerCase()) {
    case 'critical':
      return 'Urgent'
    case 'high':
      return 'High'
    case 'normal':
      return 'Normal'
    case 'low':
    default:
      return 'Low'
  }
}

const mapStatus = (status?: string): RequestStatus => {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return 'Open'
    case 'assigned':
      return 'Assigned'
    case 'in progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Open'
  }
}

const toDispatchPriority = (priority: RequestPriority) => {
  switch (priority) {
    case 'Urgent':
      return 'Critical'
    case 'High':
      return 'High'
    case 'Normal':
      return 'Normal'
    case 'Low':
    default:
      return 'Low'
  }
}

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : '—'
}

export function TechRequests() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'STATION_OWNER'
  
  const canView = hasPermission(role, 'maintenance', 'view')
  const canCreate = hasPermission(role, 'maintenance', 'create')

  const { data: dispatchesData, isLoading, error } = useDispatches()
  const { data: stationsData } = useStations()
  const createDispatch = useCreateDispatch()

  const [status, setStatus] = useState('All')
  const [type, setType] = useState('All')
  const [priority, setPriority] = useState('All')
  const [q, setQ] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TechRequest | null>(null)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  // New request form
  const [newRequest, setNewRequest] = useState({
    type: 'Repair' as RequestType,
    stationId: '',
    description: '',
    priority: 'Normal' as RequestPriority,
    dueDate: new Date().toISOString().slice(0, 10),
    dueTime: '09:00',
    estimatedDuration: '2h',
  })

  const stations = useMemo<StationLite[]>(() => {
    const raw = Array.isArray(stationsData) ? stationsData : (stationsData as any)?.data
    return (raw || [])
      .filter((s: any) => s && s.id)
      .map((s: any) => ({
        id: String(s.id),
        name: s.name,
        code: s.code,
      }))
  }, [stationsData])
  const stationMap = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations])

  const requests = useMemo<TechRequest[]>(() => {
    const raw = Array.isArray(dispatchesData) ? dispatchesData : (dispatchesData as any)?.data || []
    return raw.map((dispatch: Dispatch) => ({
      id: dispatch.id,
      type: inferType(dispatch),
      site: stationMap.get(String(dispatch.stationId))?.name || dispatch.stationName || dispatch.stationId || '—',
      charger: dispatch.stationId || dispatch.incidentId,
      description: dispatch.description || dispatch.title,
      priority: mapPriority(dispatch.priority),
      status: mapStatus(dispatch.status),
      created: formatDateTime(dispatch.createdAt),
      scheduled: dispatch.dueAt ? formatDateTime(dispatch.dueAt) : dispatch.dueDate ? `${dispatch.dueDate} ${dispatch.dueTime || ''}` : undefined,
      technician: dispatch.assignee || dispatch.assignedTo || '—',
      estimatedCost: undefined,
    }))
  }, [dispatchesData, stationMap])

  const filtered = useMemo(() =>
    requests
      .filter(r => !q || (r.id + ' ' + r.site + ' ' + r.description).toLowerCase().includes(q.toLowerCase()))
      .filter(r => status === 'All' || r.status === status)
      .filter(r => type === 'All' || r.type === type)
      .filter(r => priority === 'All' || r.priority === priority)
  , [requests, q, status, type, priority])

  const typeOptions = useMemo(() => ['All', ...Array.from(new Set(requests.map(r => r.type).filter(Boolean)))], [requests])

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRequest.stationId || !newRequest.description) {
      toast('Please fill in required fields')
      return
    }
    createDispatch.mutate(
      {
        title: `${newRequest.type} request`,
        description: newRequest.description,
        priority: toDispatchPriority(newRequest.priority),
        stationId: newRequest.stationId,
        dueDate: newRequest.dueDate,
        dueTime: newRequest.dueTime,
        estimatedDuration: newRequest.estimatedDuration,
        requiredSkills: [],
      },
      {
        onSuccess: () => {
          toast(`Tech request created: ${newRequest.type}`)
          setShowNew(false)
          setNewRequest({
            type: 'Repair',
            stationId: '',
            description: '',
            priority: 'Normal',
            dueDate: new Date().toISOString().slice(0, 10),
            dueTime: '09:00',
            estimatedDuration: '2h',
          })
        },
        onError: (err) => {
          toast(getErrorMessage(err))
        },
      }
    )
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Tech Requests.</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {getErrorMessage(error)}
        </div>
      )}
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Technician Service Requests</h2>
        {canCreate && (
          <button onClick={() => setShowNew(true)} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">
            New Request
          </button>
        )}
      </div>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-5 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search requests" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          <option value="All">All Status</option>
          <option>Open</option><option>Assigned</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {typeOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          <option value="All">All Priority</option>
          <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
        </select>
      </section>

      {/* Requests table */}
      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-subtle">
            <tr>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Site / Charger</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Technician</th>
              <th className="px-4 py-3 text-left font-medium">Scheduled</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{r.id}</td>
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3">
                  {r.site}
                  {r.charger && <span className="text-subtle"> / {r.charger}</span>}
                </td>
                <td className="px-4 py-3 max-w-xs truncate">{r.description}</td>
                <td className="px-4 py-3"><PriorityPill priority={r.priority} /></td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3 text-subtle">{r.technician || '—'}</td>
                <td className="px-4 py-3 text-subtle">{r.scheduled || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedRequest(r)} className="text-accent hover:underline text-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <div className="p-8">
            <TextSkeleton lines={2} centered />
          </div>
        )}
        {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No requests found.</div>}
      </section>

      {/* New request modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowNew(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">New Service Request</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Request Type</span>
                  <select value={newRequest.type} onChange={e => setNewRequest(r => ({ ...r, type: e.target.value as RequestType }))} className="select">
                    <option>Installation</option><option>Repair</option><option>Maintenance</option><option>Inspection</option><option>Commissioning</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Priority</span>
                  <select value={newRequest.priority} onChange={e => setNewRequest(r => ({ ...r, priority: e.target.value as RequestPriority }))} className="select">
                    <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Site *</span>
                  <select value={newRequest.stationId} onChange={e => setNewRequest(r => ({ ...r, stationId: e.target.value }))} className="select">
                    <option value="">Select site...</option>
                    {stations.map((station: any) => (
                      <option key={station.id} value={station.id}>
                        {station.name || station.code || station.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Due Date</span>
                  <input
                    type="date"
                    value={newRequest.dueDate}
                    onChange={e => setNewRequest(r => ({ ...r, dueDate: e.target.value }))}
                    className="input"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Due Time</span>
                  <input
                    type="time"
                    value={newRequest.dueTime}
                    onChange={e => setNewRequest(r => ({ ...r, dueTime: e.target.value }))}
                    className="input"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Estimated Duration</span>
                  <input
                    value={newRequest.estimatedDuration}
                    onChange={e => setNewRequest(r => ({ ...r, estimatedDuration: e.target.value }))}
                    className="input"
                    placeholder="e.g., 2h"
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Description *</span>
                <textarea value={newRequest.description} onChange={e => setNewRequest(r => ({ ...r, description: e.target.value }))} className="input h-24" placeholder="Describe the issue or work required..." />
              </label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">Create Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request detail drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setSelectedRequest(null)} />
          <div className="w-full max-w-lg bg-surface border-l border-border shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedRequest.id}</h3>
              <button onClick={() => setSelectedRequest(null)} className="px-3 py-1 rounded border border-border hover:bg-muted">Close</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-subtle">Type</div><div className="font-medium">{selectedRequest.type}</div></div>
                <div><div className="text-subtle">Priority</div><PriorityPill priority={selectedRequest.priority} /></div>
                <div><div className="text-subtle">Status</div><StatusPill status={selectedRequest.status} /></div>
                <div><div className="text-subtle">Site</div><div className="font-medium">{selectedRequest.site}</div></div>
                {selectedRequest.charger && <div><div className="text-subtle">Charger</div><div className="font-medium">{selectedRequest.charger}</div></div>}
                <div><div className="text-subtle">Created</div><div className="font-medium">{selectedRequest.created}</div></div>
                {selectedRequest.scheduled && <div><div className="text-subtle">Scheduled</div><div className="font-medium">{selectedRequest.scheduled}</div></div>}
                {selectedRequest.technician && <div><div className="text-subtle">Technician</div><div className="font-medium">{selectedRequest.technician}</div></div>}
                {selectedRequest.estimatedCost && <div><div className="text-subtle">Est. Cost</div><div className="font-medium">${selectedRequest.estimatedCost}</div></div>}
              </div>

              <div>
                <div className="text-sm text-subtle mb-1">Description</div>
                <p className="text-sm bg-muted rounded-lg p-3">{selectedRequest.description}</p>
              </div>

              {selectedRequest.status === 'Open' && (
                <div className="border-t border-border pt-4 flex gap-2">
                  <button onClick={() => toast('Assigned technician (demo)')} className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">
                    Assign Technician
                  </button>
                  <button onClick={() => toast('Cancelled request (demo)')} className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-red-600">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: RequestStatus }) {
  const colors: Record<RequestStatus, string> = {
    Open: 'bg-blue-100 text-blue-700',
    Assigned: 'bg-purple-100 text-purple-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-gray-100 text-gray-600',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status]}`}>{status}</span>
}

function PriorityPill({ priority }: { priority: RequestPriority }) {
  const colors: Record<RequestPriority, string> = {
    Low: 'bg-gray-100 text-gray-600',
    Normal: 'bg-blue-100 text-blue-700',
    High: 'bg-amber-100 text-amber-700',
    Urgent: 'bg-rose-100 text-rose-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[priority]}`}>{priority}</span>
}

export default TechRequests



