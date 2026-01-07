import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useScopeStore } from '@/core/scope/scopeStore'
import { regionInScope } from '@/core/scope/utils'

type Availability = {
  id: string
  tech: string
  region: string
  city: string
  window: string
  skills: string[]
  status: 'Available' | 'Busy' | 'Offline'
}

const mockAvailability: Availability[] = [
  { id: 'AV-001', tech: 'AmpCrew Techs', region: 'AFRICA', city: 'Nairobi', window: 'Today 8:00-18:00', skills: ['OCPP', 'HVAC'], status: 'Available' },
  { id: 'AV-002', tech: 'Partner-X', region: 'EUROPE', city: 'Berlin', window: 'Today 9:00-17:00', skills: ['Battery', 'Swap'], status: 'Busy' },
]

export function TechnicianAvailability() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'jobs')
  const { scope } = useScopeStore()

  const [status, setStatus] = useState<'All' | Availability['status']>('All')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return mockAvailability
      .filter((a) => regionInScope(scope, a.region))
      .filter((a) => (status === 'All' ? true : a.status === status))
      .filter((a) => (q ? (a.tech + ' ' + a.city).toLowerCase().includes(q.toLowerCase()) : true))
  }, [status, q, scope])

  return (
    <DashboardLayout pageTitle="Technician Availability">
      <div className="space-y-4">
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
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="font-semibold">{a.tech}</td>
                  <td>{a.region}</td>
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

