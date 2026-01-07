import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type ComponentStatus = 'Operational' | 'Degraded' | 'Partial Outage' | 'Major Outage' | 'Maintenance'

/**
 * Status Page - Admin feature
 */
export function StatusPage() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'statusPage')

  const [components, setComponents] = useState([
    { id: 'api', name: 'API', status: 'Operational' as ComponentStatus },
    { id: 'charging', name: 'Charging Network', status: 'Operational' as ComponentStatus },
    { id: 'payments', name: 'Payments', status: 'Degraded' as ComponentStatus },
    { id: 'mobile', name: 'Mobile App', status: 'Operational' as ComponentStatus },
    { id: 'dashboard', name: 'Dashboard', status: 'Operational' as ComponentStatus },
  ])

  const incidents = [
    { id: 'INC-001', title: 'Payment delays', status: 'Investigating', created: '2h ago' },
    { id: 'INC-002', title: 'Maintenance completed', status: 'Resolved', created: '1d ago' },
  ]

  function statusColor(s: ComponentStatus) {
    switch (s) {
      case 'Operational': return 'bg-ok'
      case 'Degraded': return 'bg-warn'
      case 'Partial Outage': return 'bg-warn'
      case 'Major Outage': return 'bg-danger'
      case 'Maintenance': return 'bg-muted'
    }
  }

  function updateStatus(id: string, status: ComponentStatus) {
    setComponents((list) => list.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  const allOperational = components.every((c) => c.status === 'Operational')

  return (
    <DashboardLayout pageTitle="Status Page">
      {/* Overall Status */}
      <div className={`card mb-4 ${allOperational ? 'border-l-4 border-l-ok' : 'border-l-4 border-l-warn'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${allOperational ? 'bg-ok' : 'bg-warn'}`} />
          <span className="font-semibold text-text text-lg">
            {allOperational ? 'All Systems Operational' : 'Some Systems Degraded'}
          </span>
        </div>
      </div>

      {/* Components */}
      <div className="card mb-4">
        <h3 className="font-semibold text-text mb-3">Components</h3>
        <div className="space-y-3">
          {components.map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusColor(c.status)}`} />
                <span>{c.name}</span>
              </div>
              {perms.update ? (
                <select
                  value={c.status}
                  onChange={(e) => updateStatus(c.id, e.target.value as ComponentStatus)}
                  className="select text-sm"
                >
                  <option value="Operational">Operational</option>
                  <option value="Degraded">Degraded</option>
                  <option value="Partial Outage">Partial Outage</option>
                  <option value="Major Outage">Major Outage</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              ) : (
                <span className="text-muted">{c.status}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-text">Recent Incidents</h3>
          {perms.update && (
            <button className="btn secondary" onClick={() => alert('Create incident (demo)')}>
              + New Incident
            </button>
          )}
        </div>
        <div className="space-y-2">
          {incidents.map((i) => (
            <div key={i.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
              <div>
                <div className="font-medium">{i.title}</div>
                <div className="text-xs text-muted">{i.created}</div>
              </div>
              <span className={`pill ${i.status === 'Resolved' ? 'approved' : 'pending'}`}>{i.status}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

