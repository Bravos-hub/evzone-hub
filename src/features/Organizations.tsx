import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useAuthStore } from '@/core/auth/authStore'

type OrgStatus = 'Active' | 'Pending' | 'Suspended'

type Org = {
  id: string
  name: string
  country: string
  region: string
  plan: string
  status: OrgStatus
  admins: number
  stations: number
}

const mockOrgs: Org[] = [
  { id: 'ORG-001', name: 'VoltOps Ltd', country: 'UG', region: 'AFRICA', plan: 'Scale', status: 'Active', admins: 8, stations: 142 },
  { id: 'ORG-002', name: 'GridManaged', country: 'DE', region: 'EUROPE', plan: 'Enterprise', status: 'Active', admins: 5, stations: 98 },
  { id: 'ORG-003', name: 'AmpCrew Techs', country: 'KE', region: 'AFRICA', plan: 'Growth', status: 'Pending', admins: 3, stations: 12 },
  { id: 'ORG-004', name: 'Central Park Owners Co', country: 'US', region: 'AMERICAS', plan: 'Scale', status: 'Suspended', admins: 2, stations: 24 },
]

export function Organizations() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'organizations')

  const [q, setQ] = useState('')
  const [region, setRegion] = useState<'ALL' | string>('ALL')
  const [status, setStatus] = useState<OrgStatus | 'All'>('All')
  const [plan, setPlan] = useState<'All' | string>('All')

  const rows = useMemo(() => {
    return mockOrgs
      .filter((o) => (q ? (o.name + ' ' + o.id).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((o) => (region === 'ALL' ? true : o.region === region))
      .filter((o) => (status === 'All' ? true : o.status === status))
      .filter((o) => (plan === 'All' ? true : o.plan === plan))
  }, [q, region, status, plan])

  return (
    <DashboardLayout pageTitle="Organizations">
      <div className="space-y-4">
        {/* Filters */}
        <div className="card grid md:grid-cols-5 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search org or ID"
            className="input md:col-span-2"
          />
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="select">
            {['ALL', 'AFRICA', 'EUROPE', 'AMERICAS', 'ASIA', 'MIDDLE_EAST'].map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All regions' : r}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as OrgStatus | 'All')} className="select">
            {['All', 'Active', 'Pending', 'Suspended'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="select">
            {['All', 'Growth', 'Scale', 'Enterprise', 'Trial'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        {perms.create && (
          <div className="flex items-center gap-2">
            <button className="btn secondary" onClick={() => alert('Create org (mock)')}>
              + Create organization
            </button>
          </div>
        )}

        {/* Table */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Org</th>
                <th>Country</th>
                <th>Region</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Admins</th>
                <th>Stations</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="font-semibold">
                    {o.name}
                    <div className="text-xs text-muted">{o.id}</div>
                  </td>
                  <td>{o.country}</td>
                  <td>{o.region}</td>
                  <td>{o.plan}</td>
                  <td>
                    <span
                      className={`pill ${
                        o.status === 'Active'
                          ? 'approved'
                          : o.status === 'Pending'
                          ? 'pending'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td>{o.admins}</td>
                  <td>{o.stations}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <button className="btn secondary" onClick={() => alert('Open org (mock)')}>
                        Open
                      </button>
                      {perms.edit && (
                        <button className="btn secondary" onClick={() => alert('Edit org (mock)')}>
                          Edit
                        </button>
                      )}
                      {perms.delete && (
                        <button className="btn danger" onClick={() => alert('Delete org (mock)')}>
                          Delete
                        </button>
                      )}
                    </div>
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

