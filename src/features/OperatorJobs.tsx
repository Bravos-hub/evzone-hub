import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useDispatches } from '@/modules/dispatch/hooks/useDispatches'
import { getErrorMessage } from '@/core/api/errors'
import type { Dispatch } from '@/core/api/types'

/* ─────────────────────────────────────────────────────────────────────────────
   Operator Jobs — Job board for Operators
   RBAC: Operators, Platform admins
───────────────────────────────────────────────────────────────────────────── */

type JobStatus = 'Open' | 'In progress' | 'Waiting' | 'Done' | 'Cancelled'
type JobPriority = 'Low' | 'Medium' | 'High' | 'Critical'
type JobType = 'Hardware' | 'Network' | 'Firmware' | 'Software' | 'Other'

interface OperatorJob {
  id: string
  site: string
  device: string
  type: JobType
  priority: JobPriority
  created: string
  createdAtMs: number
  due: string
  assignee: string
  status: JobStatus
}

const inferType = (dispatch: Dispatch): JobType => {
  const text = `${dispatch.title} ${dispatch.description || ''}`.toLowerCase()
  if (text.includes('network')) return 'Network'
  if (text.includes('firmware')) return 'Firmware'
  if (text.includes('software')) return 'Software'
  if (text.includes('hardware')) return 'Hardware'
  return 'Other'
}

const mapPriority = (priority?: string): JobPriority => {
  switch ((priority || '').toLowerCase()) {
    case 'critical':
      return 'Critical'
    case 'high':
      return 'High'
    case 'normal':
      return 'Medium'
    case 'low':
    default:
      return 'Low'
  }
}

const mapStatus = (status?: string): JobStatus => {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return 'Open'
    case 'assigned':
      return 'Waiting'
    case 'in progress':
      return 'In progress'
    case 'completed':
      return 'Done'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Open'
  }
}

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : '—'
}

const formatDue = (dispatch: Dispatch) => {
  if (dispatch.dueAt) return formatDateTime(dispatch.dueAt)
  if (dispatch.dueDate) return `${dispatch.dueDate}${dispatch.dueTime ? ` ${dispatch.dueTime}` : ''}`
  return '—'
}

export function OperatorJobs() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'jobs', 'view')
  const canManage = hasPermission(role, 'jobs', 'edit')

  const { data: dispatchesData, isLoading, error } = useDispatches()

  const [q, setQ] = useState('')
  const [site, setSite] = useState('All Sites')
  const [status, setStatus] = useState('All')
  const [prio, setPrio] = useState('All')
  const [type, setType] = useState('All')
  const [from, setFrom] = useState('2025-10-01')
  const [to, setTo] = useState('2025-10-31')
  const [view, setView] = useState<'Table' | 'Board'>('Table')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const jobs = useMemo<OperatorJob[]>(() => {
    const raw = Array.isArray(dispatchesData) ? dispatchesData : (dispatchesData as any)?.data || []
    return raw.map((dispatch: Dispatch) => {
      const createdMs = dispatch.createdAt ? new Date(dispatch.createdAt).getTime() : NaN
      return {
        id: dispatch.id,
        site: dispatch.stationName || dispatch.stationId || '—',
        device: dispatch.stationId || dispatch.incidentId || '—',
        type: inferType(dispatch),
        priority: mapPriority(dispatch.priority),
        created: formatDateTime(dispatch.createdAt),
        createdAtMs: Number.isFinite(createdMs) ? createdMs : Date.now(),
        due: formatDue(dispatch),
        assignee: dispatch.assignee || dispatch.assignedTo || '—',
        status: mapStatus(dispatch.status),
      }
    })
  }, [dispatchesData])

  const filtered = useMemo(() =>
    jobs
      .filter(r => !q || (r.id + ' ' + r.device + ' ' + r.site).toLowerCase().includes(q.toLowerCase()))
      .filter(r => site === 'All Sites' || r.site === site)
      .filter(r => status === 'All' || r.status === status)
      .filter(r => prio === 'All' || r.priority === prio)
      .filter(r => type === 'All' || r.type === type)
      .filter(r => r.createdAtMs >= new Date(from).getTime() && r.createdAtMs <= new Date(to + 'T23:59:59').getTime())
  , [jobs, q, site, status, prio, type, from, to])

  const siteOptions = useMemo(() => ['All Sites', ...Array.from(new Set(jobs.map(j => j.site).filter(Boolean)))], [jobs])

  const assign = (id: string) => {
    toast(`Assign ${id} modal would open`)
  }

  const start = (id: string) => {
    toast(`Started ${id}`)
  }

  const resolve = (id: string) => {
    toast(`Resolved ${id}`)
  }

  const close = (id: string) => {
    toast(`Closed ${id}`)
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Operator Jobs.</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {getErrorMessage(error)}
        </div>
      )}
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Operator Jobs</h1>
        <button
          onClick={() => setView(v => v === 'Table' ? 'Board' : 'Table')}
          className="px-4 py-2 rounded-lg border border-border hover:bg-muted flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          {view === 'Table' ? 'Board view' : 'Table view'}
        </button>
      </div>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-7 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search job / device / site" className="input pl-9" />
        </label>
        <select value={site} onChange={e => setSite(e.target.value)} className="select">
          {siteOptions.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="select">
          {['All', 'Open', 'In progress', 'Waiting', 'Done', 'Cancelled'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={prio} onChange={e => setPrio(e.target.value)} className="select">
          {['All', 'Low', 'Medium', 'High', 'Critical'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className="select">
          {['All', 'Hardware', 'Network', 'Firmware', 'Software', 'Other'].map(o => <option key={o}>{o}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input" />
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Jobs', value: filtered.length },
          { label: 'Open', value: filtered.filter(j => j.status === 'Open').length },
          { label: 'In Progress', value: filtered.filter(j => j.status === 'In progress').length },
          { label: 'Critical', value: filtered.filter(j => j.priority === 'Critical').length },
          { label: 'Done', value: filtered.filter(j => j.status === 'Done').length },
        ].map(k => (
          <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Table View */}
      {view === 'Table' && (
        <section className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Job</th>
                <th className="px-4 py-3 text-left font-medium">Site</th>
                <th className="px-4 py-3 text-left font-medium">Device</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Due</th>
                <th className="px-4 py-3 text-left font-medium">Assignee</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{r.id}</td>
                  <td className="px-4 py-3">{r.site}</td>
                  <td className="px-4 py-3">{r.device}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3"><PriorityPill priority={r.priority} /></td>
                  <td className="px-4 py-3 text-subtle">{r.created}</td>
                  <td className="px-4 py-3 text-subtle">{r.due}</td>
                  <td className="px-4 py-3">{r.assignee}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {r.status === 'Open' && r.assignee === '—' && (
                          <button onClick={() => assign(r.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Assign</button>
                        )}
                        {r.status === 'Open' && r.assignee !== '—' && (
                          <button onClick={() => start(r.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Start</button>
                        )}
                        {r.status === 'In progress' && (
                          <button onClick={() => resolve(r.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Resolve</button>
                        )}
                        {r.status !== 'Done' && r.status !== 'Cancelled' && (
                          <button onClick={() => close(r.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Close</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <div className="p-8 text-center text-subtle">Loading jobs...</div>}
          {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No jobs match your filters.</div>}
        </section>
      )}

      {/* Board View */}
      {view === 'Board' && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Open', 'In progress', 'Waiting', 'Done'].map(statusCol => (
            <div key={statusCol} className="rounded-xl bg-surface border border-border p-4">
              <h3 className="font-semibold mb-3">{statusCol}</h3>
              <div className="space-y-2">
                {filtered.filter(j => j.status === statusCol || (statusCol === 'Open' && j.status === 'Open')).map(j => (
                  <div key={j.id} className="rounded-lg border border-border p-3 bg-muted hover:shadow-md transition-shadow">
                    <div className="font-medium text-sm">{j.id}</div>
                    <div className="text-xs text-subtle mt-1">{j.site} • {j.device}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <PriorityPill priority={j.priority} />
                      <span className="text-xs text-subtle">{j.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function PriorityPill({ priority }: { priority: JobPriority }) {
  const colors: Record<JobPriority, string> = {
    Low: 'bg-gray-100 text-gray-600',
    Medium: 'bg-blue-100 text-blue-700',
    High: 'bg-amber-100 text-amber-700',
    Critical: 'bg-rose-100 text-rose-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[priority]}`}>{priority}</span>
}

function StatusPill({ status }: { status: JobStatus }) {
  const colors: Record<JobStatus, string> = {
    Open: 'bg-blue-100 text-blue-700',
    'In progress': 'bg-amber-100 text-amber-700',
    Waiting: 'bg-purple-100 text-purple-700',
    Done: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-gray-100 text-gray-600',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default OperatorJobs

