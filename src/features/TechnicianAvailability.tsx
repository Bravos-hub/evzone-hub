import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useScopeStore } from '@/core/scope/scopeStore'
import { regionInScope } from '@/core/scope/utils'
import { useTechnicianAvailability } from '@/modules/admin/hooks/useTechnicianAvailability'
import { getErrorMessage } from '@/core/api/errors'
import { LoadingRow } from '@/ui/components/SkeletonCards'

type Availability = {
  id: string
  tech: string
  region?: string
  city: string
  window: string
  skills: string[]
  status: 'Available' | 'Busy' | 'Offline'
}

const mapStatus = (status?: string): Availability['status'] => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'Available'
    case 'busy':
    case 'break':
      return 'Busy'
    case 'offline':
    default:
      return 'Offline'
  }
}

const splitLocation = (location?: string) => {
  if (!location) return { city: '—', region: undefined }
  const parts = location.split(',').map(part => part.trim()).filter(Boolean)
  if (parts.length === 1) return { city: parts[0], region: undefined }
  return { city: parts[0], region: parts[1] }
}

export function TechnicianAvailability() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'jobs')
  const { scope } = useScopeStore()

  const { technicians, isLoading, error } = useTechnicianAvailability()

  const [status, setStatus] = useState<'All' | Availability['status']>('All')
  const [q, setQ] = useState('')

  const rows = useMemo<Availability[]>(() => {
    return (technicians || [])
      .map((tech) => {
        const location = splitLocation(tech.location)
        return {
          id: tech.id,
          tech: tech.user?.name || tech.userId,
          region: location.region,
          city: location.city,
          window: tech.lastPulse ? new Date(tech.lastPulse).toLocaleString() : '—',
          skills: [],
          status: mapStatus(tech.status),
        }
      })
      .filter((a) => regionInScope(scope, a.region))
      .filter((a) => (status === 'All' ? true : a.status === status))
      .filter((a) => (q ? (a.tech + ' ' + a.city).toLowerCase().includes(q.toLowerCase()) : true))
  }, [technicians, status, q, scope])

  return (
    <DashboardLayout pageTitle="Technician Availability">
      <div className="space-y-4">
        {error && (
          <div className="card border border-red-200 bg-red-50 text-red-700 text-sm">
            {getErrorMessage(error)}
          </div>
        )}
        <div className="card grid md:grid-cols-3 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search technician/city" className="input md:col-span-2" />
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="select">
            {['All', 'Available', 'Busy', 'Offline'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tech</th>
                <th>Region</th>
                <th>City</th>
                <th>Window</th>
                <th>Skills</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <LoadingRow colSpan={6} />}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-subtle">No technicians match your filters.</td>
                </tr>
              )}
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="font-semibold">{a.tech}</td>
                  <td>{a.region || '—'}</td>
                  <td>{a.city}</td>
                  <td>{a.window}</td>
                  <td className="text-sm text-muted">{a.skills.join(', ')}</td>
                  <td>
                    <span
                      className={`pill ${
                        a.status === 'Available'
                          ? 'approved'
                          : a.status === 'Busy'
                          ? 'pending'
                          : 'bg-muted/30 text-muted'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

