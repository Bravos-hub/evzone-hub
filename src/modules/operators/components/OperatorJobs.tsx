import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

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
  due: string
  assignee: string
  status: JobStatus
}

const MOCK_JOBS: OperatorJob[] = [
  { id: 'JOB-441', site: 'Central Hub', device: 'CP-A1', type: 'Hardware', priority: 'High', created: '2025-10-28 09:15', due: '2025-10-28 17:15', assignee: '—', status: 'Open' },
  { id: 'JOB-440', site: 'Airport East', device: 'CP-B4', type: 'Network', priority: 'Medium', created: '2025-10-27 22:05', due: '2025-10-28 04:05', assignee: 'RapidCharge Techs', status: 'In progress' },
  { id: 'JOB-439', site: 'Tech Park A', device: 'CP-C2', type: 'Firmware', priority: 'Medium', created: '2025-10-25 15:02', due: '2025-10-26 15:02', assignee: 'FixVolt Ltd', status: 'Waiting' },
  { id: 'JOB-438', site: 'Central Hub', device: 'SS-701', type: 'Hardware', priority: 'Critical', created: '2025-10-24 11:30', due: '2025-10-24 15:30', assignee: 'Aisha N.', status: 'Done' },
  { id: 'JOB-437', site: 'Business Park', device: 'CP-D3', type: 'Software', priority: 'Low', created: '2025-10-23 14:20', due: '2025-10-25 14:20', assignee: '—', status: 'Open' },
]

export function OperatorJobs() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'jobs', 'view')
  const canManage = hasPermission(role, 'jobs', 'edit')

  const [q, setQ] = useState('')
  const [site, setSite] = useState('All Sites')
  const [status, setStatus] = useState('All')
  const [prio, setPrio] = useState('All')
  const [type, setType] = useState('All')
  const [from, setFrom] = useState('2025-10-01')
  const [to, setTo] = useState('2025-10-31')
  const [view, setView] = useState<'Table' | 'Board'>('Table')
  const [jobs, setJobs] = useState(MOCK_JOBS)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const filtered = useMemo(() =>
    jobs
      .filter(r => !q || (r.id + ' ' + r.device + ' ' + r.site).toLowerCase().includes(q.toLowerCase()))
      .filter(r => site === 'All Sites' || r.site === site)
      .filter(r => status === 'All' || r.status === status)
      .filter(r => prio === 'All' || r.priority === prio)
      .filter(r => type === 'All' || r.type === type)
      .filter(r => new Date(r.created) >= new Date(from) && new Date(r.created) <= new Date(to + 'T23:59:59'))
  , [jobs, q, site, status, prio, type, from, to])

  const assign = (id: string) => {
    toast(`Assign ${id} modal would open`)
  }

  const start = (id: string) => {
    setJobs(list => list.map(j => j.id === id ? { ...j, status: 'In progress' as JobStatus } : j))
    toast(`Started ${id}`)
  }

  const resolve = (id: string) => {
    setJobs(list => list.map(j => j.id === id ? { ...j, status: 'Done' as JobStatus } : j))
    toast(`Resolved ${id}`)
  }

  const close = (id: string) => {
    setJobs(list => list.map(j => j.id === id ? { ...j, status: 'Done' as JobStatus } : j))
    toast(`Closed ${id}`)
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Operator Jobs.</div>
  }

  return (
    <div className="space-y-6">
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
          {['All Sites', 'Central Hub', 'Airport East', 'Tech Park A', 'Business Park'].map(o => <option key={o}>{o}</option>)}
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
          {filtered.length === 0 && <div className="p-8 text-center text-subtle">No jobs match your filters.</div>}
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

