import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useTechnicianJobs } from '@/modules/dispatch/hooks/useTechnicianJobs'
import { getErrorMessage } from '@/core/api/errors'
import type { TechnicianJob } from '@/modules/operators/services/techniciansService'

/* ─────────────────────────────────────────────────────────────────────────────
   Technician Jobs — Job management, surveys, tests, invoices
   RBAC: Technicians (view/manage assigned), Owners/Operators (view)
───────────────────────────────────────────────────────────────────────────── */

type JobStatus = 'Available' | 'Accepted' | 'In Progress' | 'Completed' | 'Cancelled'
type JobType = 'Installation' | 'Repair' | 'Maintenance' | 'Inspection' | 'Commissioning'

interface Job {
  id: string
  type: JobType
  site: string
  address: string
  charger?: string
  description: string
  status: JobStatus
  postedAt?: string
  scheduledDate: string
  scheduledTime: string
  estimatedDuration: string
  payRate: number
  client: string
  contactPhone: string
  notes?: string
}

const inferType = (title: string, description?: string): JobType => {
  const text = `${title} ${description || ''}`.toLowerCase()
  if (text.includes('install')) return 'Installation'
  if (text.includes('repair')) return 'Repair'
  if (text.includes('inspect')) return 'Inspection'
  if (text.includes('commission')) return 'Commissioning'
  return 'Maintenance'
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : '—'
}

const formatTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
}

const mapJob = (job: TechnicianJob): Job => ({
  id: job.id,
  type: inferType(job.title, job.description),
  site: job.station,
  address: job.location,
  charger: undefined,
  description: job.description || job.title,
  status: job.status as JobStatus,
  postedAt: job.posted,
  scheduledDate: formatDate(job.posted),
  scheduledTime: formatTime(job.posted),
  estimatedDuration: '—',
  payRate: job.pay,
  client: job.station,
  contactPhone: '—',
})

export function TechnicianJobs() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'TECHNICIAN_PUBLIC'
  
  const canView = hasPermission(role, 'jobs', 'view')
  const canManage = ['TECHNICIAN_ORG', 'TECHNICIAN_PUBLIC'].includes(role)

  const { data: jobsData, isLoading, error } = useTechnicianJobs()

  const [status, setStatus] = useState('All')
  const [type, setType] = useState('All')
  const [q, setQ] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'survey' | 'tests' | 'invoice'>('details')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const jobs = useMemo<Job[]>(() => {
    const raw = Array.isArray(jobsData) ? jobsData : (jobsData as any)?.data || []
    return raw.map((job: TechnicianJob) => mapJob(job))
  }, [jobsData])

  const filtered = useMemo(() =>
    jobs
      .filter(j => !q || (j.id + ' ' + j.site + ' ' + j.description).toLowerCase().includes(q.toLowerCase()))
      .filter(j => status === 'All' || j.status === status)
      .filter(j => type === 'All' || j.type === type)
  , [jobs, q, status, type])

  const kpis = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const completedRecent = jobs.filter(j => j.status === 'Completed' && j.postedAt && new Date(j.postedAt) >= thirtyDaysAgo)
    return {
      pending: jobs.filter(j => j.status === 'Available').length,
      inProgress: jobs.filter(j => j.status === 'In Progress').length,
      completedRecent: completedRecent.length,
      earningsRecent: completedRecent.reduce((sum, j) => sum + j.payRate, 0),
    }
  }, [jobs])

  const handleStatusUpdate = (jobId: string, newStatus: JobStatus) => {
    toast(`Updated ${jobId} to ${newStatus}`)
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Jobs.</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {getErrorMessage(error)}
        </div>
      )}
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">Available Jobs</div>
          <div className="mt-2 text-2xl font-bold">{kpis.pending}</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">In Progress</div>
          <div className="mt-2 text-2xl font-bold">{kpis.inProgress}</div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="text-sm text-subtle">Completed (30d)</div>
          <div className="mt-2 text-2xl font-bold">{kpis.completedRecent}</div>
        </div>
        <div className="rounded-xl bg-accent text-white border border-accent p-5 shadow-sm">
          <div className="text-sm text-white/80">Earnings (30d)</div>
          <div className="mt-2 text-2xl font-bold">${kpis.earningsRecent.toFixed(0)}</div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-4 gap-3">
        <label className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search jobs" className="input" />
        </label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="select">
          <option value="All">All Status</option>
          <option>Available</option><option>Accepted</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className="select">
          <option value="All">All Types</option>
          <option>Installation</option><option>Repair</option><option>Maintenance</option><option>Inspection</option><option>Commissioning</option>
        </select>
        <div className="text-sm text-subtle self-center text-right">{filtered.length} jobs</div>
      </section>

      {/* Jobs list */}
      <section className="space-y-3">
        {isLoading && (
          <div className="p-8 text-center text-subtle rounded-xl border border-border bg-surface">Loading jobs...</div>
        )}
        {filtered.map(job => (
          <div key={job.id} className="rounded-xl bg-surface border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{job.id}</span>
                  <StatusPill status={job.status} />
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{job.type}</span>
                </div>
                <div className="text-sm text-subtle">{job.site} • {job.address}</div>
                {job.charger && <div className="text-xs text-subtle">Charger: {job.charger}</div>}
                <p className="text-sm mt-2">{job.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-accent">${job.payRate}</div>
                <div className="text-xs text-subtle">{job.estimatedDuration}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="text-sm text-subtle">
                <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                {job.scheduledDate} at {job.scheduledTime}
              </div>
              <div className="flex gap-2">
                {canManage && job.status === 'Available' && (
                  <>
                    <button onClick={() => handleStatusUpdate(job.id, 'Accepted')} className="px-3 py-1 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover">Accept</button>
                    <button onClick={() => handleStatusUpdate(job.id, 'Cancelled')} className="px-3 py-1 rounded-lg border border-border text-sm hover:bg-muted">Decline</button>
                  </>
                )}
                {canManage && job.status === 'Accepted' && (
                  <button onClick={() => handleStatusUpdate(job.id, 'In Progress')} className="px-3 py-1 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover">Start Job</button>
                )}
                {canManage && job.status === 'In Progress' && (
                  <button onClick={() => handleStatusUpdate(job.id, 'Completed')} className="px-3 py-1 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover">Complete</button>
                )}
                <button onClick={() => setSelectedJob(job)} className="px-3 py-1 rounded-lg border border-border text-sm hover:bg-muted">View Details</button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle rounded-xl border border-border bg-surface">No jobs found.</div>}
      </section>

      {/* Job detail drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setSelectedJob(null)} />
          <div className="w-full max-w-xl bg-surface border-l border-border shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedJob.id}</h3>
              <button onClick={() => setSelectedJob(null)} className="px-3 py-1 rounded border border-border hover:bg-muted">Close</button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border px-6">
              <div className="flex gap-4">
                {(['details', 'survey', 'tests', 'invoice'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-medium border-b-2 capitalize ${activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-subtle hover:text-fg'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Details tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><div className="text-subtle">Status</div><StatusPill status={selectedJob.status} /></div>
                    <div><div className="text-subtle">Type</div><div className="font-medium">{selectedJob.type}</div></div>
                    <div><div className="text-subtle">Site</div><div className="font-medium">{selectedJob.site}</div></div>
                    <div><div className="text-subtle">Address</div><div className="font-medium">{selectedJob.address}</div></div>
                    <div><div className="text-subtle">Scheduled</div><div className="font-medium">{selectedJob.scheduledDate} at {selectedJob.scheduledTime}</div></div>
                    <div><div className="text-subtle">Duration</div><div className="font-medium">{selectedJob.estimatedDuration}</div></div>
                    <div><div className="text-subtle">Pay Rate</div><div className="font-medium text-accent">${selectedJob.payRate}</div></div>
                    <div><div className="text-subtle">Client</div><div className="font-medium">{selectedJob.client}</div></div>
                    <div className="col-span-2"><div className="text-subtle">Contact</div><div className="font-medium">{selectedJob.contactPhone}</div></div>
                  </div>
                  <div>
                    <div className="text-sm text-subtle mb-1">Description</div>
                    <p className="text-sm bg-muted rounded-lg p-3">{selectedJob.description}</p>
                  </div>
                  {selectedJob.notes && (
                    <div>
                      <div className="text-sm text-subtle mb-1">Notes</div>
                      <p className="text-sm bg-amber-50 text-amber-800 rounded-lg p-3">{selectedJob.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Survey tab */}
              {activeTab === 'survey' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Site Survey Form</h4>
                  <label className="grid gap-1">
                    <span className="text-sm">Site Condition</span>
                    <select className="rounded-lg border border-border px-3 py-2">
                      <option>Good</option><option>Fair</option><option>Poor</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm">Electrical Infrastructure</span>
                    <textarea className="rounded-lg border border-border px-3 py-2 h-24" placeholder="Describe the existing electrical setup..." />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm">Photos</span>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-subtle">
                      <button className="text-accent hover:underline">Upload photos</button>
                    </div>
                  </label>
                  <button onClick={() => toast('Survey saved (demo)')} className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">Save Survey</button>
                </div>
              )}

              {/* Tests tab */}
              {activeTab === 'tests' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Commissioning Tests</h4>
                  <div className="space-y-3">
                    {['Ground Continuity', 'Insulation Resistance', 'Earth Fault Loop', 'RCD Trip Time', 'Polarity Check'].map(test => (
                      <div key={test} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <span className="text-sm">{test}</span>
                        <div className="flex items-center gap-2">
                          <input type="number" className="w-20 rounded border border-border px-2 py-1 text-sm" placeholder="Value" />
                          <select className="rounded border border-border px-2 py-1 text-sm">
                            <option>Pass</option><option>Fail</option><option>N/A</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => toast('Tests saved (demo)')} className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">Save Test Results</button>
                </div>
              )}

              {/* Invoice tab */}
              {activeTab === 'invoice' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Generate Invoice</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm">Labor Hours</span>
                      <input type="number" className="input" placeholder="0" defaultValue="2" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-sm">Hourly Rate ($)</span>
                      <input type="number" className="input" defaultValue={selectedJob.payRate} />
                    </label>
                  </div>
                  <label className="grid gap-1">
                    <span className="text-sm">Parts & Materials</span>
                    <textarea className="input h-20" placeholder="List any parts used..." />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm">Parts Cost ($)</span>
                    <input type="number" className="input" placeholder="0" />
                  </label>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Labor</span><span>${selectedJob.payRate * 2}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Parts</span><span>$0</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border">
                      <span>Total</span><span>${selectedJob.payRate * 2}</span>
                    </div>
                  </div>
                  <button onClick={() => toast('Invoice generated (demo)')} className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">Generate Invoice</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: JobStatus }) {
  const colors: Record<JobStatus, string> = {
    Available: 'bg-gray-100 text-gray-700',
    Accepted: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-purple-100 text-purple-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-rose-100 text-rose-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status]}`}>{status}</span>
}

export default TechnicianJobs

