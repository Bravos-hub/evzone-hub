import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { regionInScope } from '@/core/scope/utils'
import { useScopeStore } from '@/core/scope/scopeStore'

type SiteStatus = 'Draft' | 'Listed' | 'Leased'

type Site = {
  id: string
  name: string
  address: string
  region: string
  status: SiteStatus
  slots: number
  payout: number
}

const mockSites: Site[] = [
  { id: 'SITE-001', name: 'City Mall Rooftop', address: 'Kampala Road', region: 'AFRICA', status: 'Leased', slots: 5, payout: 5200 },
  { id: 'SITE-002', name: 'Tech Park Lot', address: 'Innovation Dr', region: 'AFRICA', status: 'Listed', slots: 8, payout: 0 },
  { id: 'SITE-003', name: 'Airport Terminal', address: 'Entebbe', region: 'AFRICA', status: 'Draft', slots: 3, payout: 0 },
]

export function SiteOwnerSites() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'sites')
  const { scope } = useScopeStore()

  const [status, setStatus] = useState<SiteStatus | 'All'>('All')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return mockSites
      .filter((s) => regionInScope(scope, s.region))
      .filter((s) => (status === 'All' ? true : s.status === status))
      .filter((s) => (q ? (s.name + ' ' + s.address).toLowerCase().includes(q.toLowerCase()) : true))
  }, [status, q, scope])

  return (
    <DashboardLayout pageTitle="Site Owner — Sites">
      <div className="space-y-4">
        <div className="card grid md:grid-cols-3 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search site/address" className="input md:col-span-2" />
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="select">
            {['All', 'Draft', 'Listed', 'Leased'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Address</th>
                <th>Status</th>
                <th>Slots</th>
                <th className="!text-right">Expected payout</th>
                <th className="!text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold">{s.name}</td>
                  <td className="text-sm text-muted">{s.address}</td>
                  <td>
                    <span
                      className={`pill ${
                        s.status === 'Leased'
                          ? 'approved'
                          : s.status === 'Listed'
                          ? 'pending'
                          : 'bg-muted/30 text-muted'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td>{s.slots}</td>
                  <td className="text-right">${s.payout.toLocaleString()}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <button className="btn secondary" onClick={() => alert('Open site (mock)')}>
                        Open
                      </button>
                      {perms.edit && (
                        <button className="btn secondary" onClick={() => alert('Edit (mock)')}>
                          Edit
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

