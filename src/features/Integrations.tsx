import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useApiKeys, useSecrets, useRotateApiKey, useRevokeApiKey, useRotateSecret } from '@/modules/integrations/useIntegrationKeys'
import { getErrorMessage } from '@/core/api/errors'

/**
 * Integrations Page - Admin feature (API Keys, Secrets)
 */
export function Integrations() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'integrations')

  const [tab, setTab] = useState<'apiKeys' | 'secrets'>('apiKeys')

  const { data: apiKeysData = [], isLoading: apiKeysLoading, error: apiKeysError } = useApiKeys()
  const { data: secretsData = [], isLoading: secretsLoading, error: secretsError } = useSecrets()
  const rotateApiKey = useRotateApiKey()
  const revokeApiKey = useRevokeApiKey()
  const rotateSecret = useRotateSecret()

  const apiKeys = (Array.isArray(apiKeysData) ? apiKeysData : (apiKeysData as any)?.data || []).map((k: any) => ({
    id: k.id,
    name: k.name || '—',
    prefix: k.prefix || (k.id ? k.id.slice(0, 8) : 'key_'),
    status: (k.status || 'Active') as 'Active' | 'Revoked',
    created: k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—',
    lastUsed: k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '—',
  }))

  const secrets = (Array.isArray(secretsData) ? secretsData : (secretsData as any)?.data || []).map((s: any) => ({
    id: s.id,
    name: s.name || '—',
    environment: s.environment || 'All',
    lastRotated: s.lastRotatedAt ? new Date(s.lastRotatedAt).toLocaleDateString() : '—',
  }))

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

      {(apiKeysError || secretsError) && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">
            {getErrorMessage(apiKeysError || secretsError)}
          </div>
        </div>
      )}

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
              {apiKeysLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">Loading API keys...</td>
                </tr>
              )}
              {!apiKeysLoading && apiKeys.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">No API keys found.</td>
                </tr>
              )}
              {!apiKeysLoading && apiKeys.map((k) => (
                <tr key={k.id}>
                  <td className="font-semibold text-text">{k.name}</td>
                  <td><code className="text-sm bg-muted/10 px-2 py-0.5 rounded">{k.prefix}...</code></td>
                  <td><span className={`pill ${k.status === 'Active' ? 'approved' : 'rejected'}`}>{k.status}</span></td>
                  <td className="text-sm">{k.created}</td>
                  <td className="text-sm text-muted">{k.lastUsed}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      {perms.rotateKeys && k.status === 'Active' && (
                        <button
                          className="btn secondary"
                          onClick={() =>
                            rotateApiKey.mutate(k.id, {
                              onSuccess: () => alert('API key rotated'),
                              onError: (err) => alert(getErrorMessage(err)),
                            })
                          }
                        >
                          Rotate
                        </button>
                      )}
                      {perms.delete && k.status === 'Active' && (
                        <button
                          className="btn danger"
                          onClick={() =>
                            revokeApiKey.mutate(k.id, {
                              onSuccess: () => alert('API key revoked'),
                              onError: (err) => alert(getErrorMessage(err)),
                            })
                          }
                        >
                          Revoke
                        </button>
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
              {secretsLoading && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted">Loading secrets...</td>
                </tr>
              )}
              {!secretsLoading && secrets.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted">No secrets found.</td>
                </tr>
              )}
              {!secretsLoading && secrets.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-text">{s.name}</td>
                  <td><span className="chip">{s.environment}</span></td>
                  <td className="text-sm">{s.lastRotated}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <button className="btn secondary" onClick={() => alert(`View ${s.id} (demo)`)}>View</button>
                      {perms.rotateKeys && (
                        <button
                          className="btn secondary"
                          onClick={() =>
                            rotateSecret.mutate(s.id, {
                              onSuccess: () => alert('Secret rotated'),
                              onError: (err) => alert(getErrorMessage(err)),
                            })
                          }
                        >
                          Rotate
                        </button>
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

