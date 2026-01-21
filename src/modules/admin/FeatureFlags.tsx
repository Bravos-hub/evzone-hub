import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type Flag = {
  key: string
  description: string
  enabled: boolean
  audience: 'All' | 'Admin' | 'Operator' | 'Owner'
}

const mockFlags: Flag[] = [
  { key: 'new-dashboard', description: 'Enable new dashboard widgets', enabled: true, audience: 'All' },
  { key: 'ocpp-2.0', description: 'OCPP 2.0.1 beta', enabled: false, audience: 'Operator' },
  { key: 'marketplace', description: 'Marketplace surfaces', enabled: true, audience: 'All' },
  { key: 'audit-deep', description: 'Deep audit export', enabled: false, audience: 'Admin' },
]

export function FeatureFlags() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'featureFlags')

  const [audience, setAudience] = useState<'All' | Flag['audience']>('All')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return mockFlags
      .filter((f) => (audience === 'All' ? true : f.audience === audience))
      .filter((f) => (q ? (f.key + ' ' + f.description).toLowerCase().includes(q.toLowerCase()) : true))
  }, [audience, q])

  function toggle(key: string) {
    if (!perms.edit) return alert('Not allowed')
    alert(`Toggled ${key} (mock)`)
  }

  return (
    <DashboardLayout pageTitle="Feature Flags">
      <div className="space-y-4">
        <div className="card grid md:grid-cols-3 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search flags" className="input" />
          <select value={audience} onChange={(e) => setAudience(e.target.value as Flag['audience'] | 'All')} className="select">
            {['All', 'Admin', 'Operator', 'Owner'].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Flag</th>
                <th>Audience</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.key}>
                  <td className="font-semibold">{f.key}</td>
                  <td>{f.audience}</td>
                  <td className="text-sm text-muted">{f.description}</td>
                  <td>
                    <span className={`pill ${f.enabled ? 'approved' : 'bg-muted/30 text-muted'}`}>{f.enabled ? 'Enabled' : 'Disabled'}</span>
                  </td>
                  <td className="text-right">
                    <button className="btn secondary" onClick={() => toggle(f.key)}>
                      Toggle
                    </button>
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

