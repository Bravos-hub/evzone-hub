import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useTechnicianJobs } from '../hooks/useTechnicianJobs'
import type { TechnicianJob } from '@/modules/operators/services/techniciansService'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

type JobStatus = 'Available' | 'Accepted' | 'In Progress' | 'Completed' | 'Cancelled'
type JobPriority = 'Urgent' | 'High' | 'Normal' | 'Low'

/**
 * Jobs Page - Technician feature
 */
export function Jobs() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'jobs')

  const { data: jobs, isLoading } = useTechnicianJobs()

  const [statusFilter, setStatusFilter] = useState<JobStatus | 'All'>('All')

  const filtered = useMemo(() => {
    return (jobs || []).filter((j) => (statusFilter === 'All' ? true : j.status === statusFilter))
  }, [jobs, statusFilter])

  function statusColor(s: string) {
    switch (s) {
      case 'Available': return 'bg-accent/20 text-accent'
      case 'Accepted': return 'pending'
      case 'In Progress': return 'bg-warn/20 text-warn'
      case 'Completed': return 'approved'
      case 'Cancelled': return 'rejected'
      default: return 'text-muted'
    }
  }

  function priorityColor(p: string) {
    switch (p) {
      case 'Urgent': return 'bg-danger text-white'
      case 'High': return 'bg-warn text-white'
      case 'Normal': return 'bg-muted/30 text-muted'
      case 'Low': return 'bg-muted/20 text-muted'
      default: return 'bg-muted/10 text-muted'
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Jobs">
        <div className="card py-12">
          <TextSkeleton lines={2} centered />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Jobs">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Available</div>
          <div className="text-xl font-bold text-accent">{(jobs || []).filter((j) => j.status === 'Available').length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">My Active</div>
          <div className="text-xl font-bold text-warn">{(jobs || []).filter((j) => j.status === 'In Progress' || j.status === 'Accepted').length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Completed</div>
          <div className="text-xl font-bold text-ok">{(jobs || []).filter((j) => j.status === 'Completed').length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Total Earnings</div>
          <div className="text-xl font-bold text-text">${(jobs || []).reduce((acc, j) => acc + (j.status === 'Completed' ? j.pay : 0), 0)}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'All')} className="select">
          <option value="All">All Jobs</option>
          <option value="Available">Available</option>
          <option value="Accepted">Accepted</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filtered.map((j) => (
          <div key={j.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">{j.title}</span>
                  <span className={`pill ${priorityColor(j.priority)}`}>{j.priority}</span>
                  <span className={`pill ${statusColor(j.status)}`}>{j.status}</span>
                </div>
                <div className="text-sm text-muted mt-1">{j.station} • {j.location}</div>
                <div className="text-xs text-muted mt-1">Posted {new Date(j.posted).toLocaleString()}</div>
                {j.description && <div className="text-xs text-muted mt-2">{j.description}</div>}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-ok">${j.pay}</div>
                <div className="mt-2 flex gap-2">
                  {perms.accept && j.status === 'Available' && (
                    <button className="btn secondary" onClick={() => alert(`Accept ${j.id} (demo - backend ready)`)}>Accept</button>
                  )}
                  {perms.complete && j.status === 'In Progress' && (
                    <button className="btn" style={{ background: '#03cd8c', color: 'white' }} onClick={() => alert(`Complete ${j.id} (demo - backend ready)`)}>Complete</button>
                  )}
                  <button className="btn secondary" onClick={() => alert(`View ${j.id} (demo)`)}>Details</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted">No jobs found.</div>
        )}
      </div>
    </DashboardLayout>
  )
}

