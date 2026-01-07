import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

/**
 * Integrations Page - Admin feature (API Keys, Secrets)
 */
export function Integrations() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'integrations')

  const [tab, setTab] = useState<'apiKeys' | 'secrets'>('apiKeys')

  const mockApiKeys = [
    { id: 'KEY-001', name: 'Production API', prefix: 'evz_live_', status: 'Active', created: '2024-06-01', lastUsed: '1m ago' },
    { id: 'KEY-002', name: 'Test API', prefix: 'evz_test_', status: 'Active', created: '2024-08-15', lastUsed: '2h ago' },
    { id: 'KEY-003', name: 'Legacy Integration', prefix: 'evz_leg_', status: 'Revoked', created: '2024-01-10', lastUsed: '30d ago' },
  ]

  const mockSecrets = [
    { id: 'SEC-001', name: 'Payment Gateway Key', environment: 'Production', lastRotated: '2024-11-15' },
    { id: 'SEC-002', name: 'OCPP Auth Token', environment: 'All', lastRotated: '2024-10-01' },
    { id: 'SEC-003', name: 'MQTT Credentials', environment: 'Production', lastRotated: '2024-12-01' },
  ]

  return (
    <DashboardLayout pageTitle="Integrations">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-light pb-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'apiKeys' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
          onClick={() => setTab('apiKeys')}
        >
          API Keys
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'secrets' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
          onClick={() => setTab('secrets')}
        >
          Secrets
        </button>
      </div>

      {/* Actions */}
      {perms.create && (
        <div className="mb-4">
          <button className="btn secondary" onClick={() => alert(`Create ${tab === 'apiKeys' ? 'API key' : 'secret'} (demo)`)}>
            + New {tab === 'apiKeys' ? 'API Key' : 'Secret'}
          </button>
        </div>
      )}

      {tab === 'apiKeys' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key Prefix</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Used</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockApiKeys.map((k) => (
                <tr key={k.id}>
                  <td className="font-semibold text-text">{k.name}</td>
                  <td><code className="text-sm bg-muted/10 px-2 py-0.5 rounded">{k.prefix}...</code></td>
                  <td><span className={`pill ${k.status === 'Active' ? 'approved' : 'rejected'}`}>{k.status}</span></td>
                  <td className="text-sm">{k.created}</td>
                  <td className="text-sm text-muted">{k.lastUsed}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      {perms.rotateKeys && k.status === 'Active' && (
                        <button className="btn secondary" onClick={() => alert(`Rotate ${k.id} (demo)`)}>Rotate</button>
                      )}
                      {perms.delete && k.status === 'Active' && (
                        <button className="btn danger" onClick={() => alert(`Revoke ${k.id} (demo)`)}>Revoke</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'secrets' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Environment</th>
                <th>Last Rotated</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockSecrets.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-text">{s.name}</td>
                  <td><span className="chip">{s.environment}</span></td>
                  <td className="text-sm">{s.lastRotated}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <button className="btn secondary" onClick={() => alert(`View ${s.id} (demo)`)}>View</button>
                      {perms.rotateKeys && (
                        <button className="btn secondary" onClick={() => alert(`Rotate ${s.id} (demo)`)}>Rotate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}

