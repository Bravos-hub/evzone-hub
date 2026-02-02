import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/core/api/client'
import { getErrorMessage } from '@/core/api/errors'

type Flag = {
  key: string
  description: string
  enabled: boolean
  audience: 'All' | 'Admin' | 'Operator' | 'STATION_OWNER'
}

function normalizeAudience(value: unknown): Flag['audience'] {
  const v = String(value || '').toUpperCase()
  if (v === 'ADMIN') return 'Admin'
  if (v === 'OPERATOR') return 'Operator'
  if (v === 'STATION_OWNER') return 'STATION_OWNER'
  return 'All'
}

export function FeatureFlags() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'featureFlags')
  const queryClient = useQueryClient()

  const { data: flagsData, isLoading, error } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => apiClient.get<any>('/feature-flags'),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      return apiClient.patch(`/feature-flags/${key}`, { isEnabled: enabled })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })

  const [audience, setAudience] = useState<'All' | Flag['audience']>('All')
  const [q, setQ] = useState('')

  const flags = useMemo<Flag[]>(() => {
    const raw = Array.isArray(flagsData) ? flagsData : (flagsData?.data ?? [])
    return raw.map((f: any) => ({
      key: f.key ?? f.name ?? '—',
      description: f.description ?? f.desc ?? '',
      enabled: Boolean(f.isEnabled ?? f.enabled),
      audience: normalizeAudience(f.audience ?? f.scope ?? f.role),
    }))
  }, [flagsData])

  const rows = useMemo(() => {
    return flags
      .filter((f) => (audience === 'All' ? true : f.audience === audience))
      .filter((f) => (q ? (f.key + ' ' + f.description).toLowerCase().includes(q.toLowerCase()) : true))
  }, [audience, q, flags])

  function toggle(key: string, enabled: boolean) {
    if (!perms.edit) return alert('Not allowed')
    toggleMutation.mutate({ key, enabled })
  }

  return (
    <DashboardLayout pageTitle="Feature Flags">
      <div className="space-y-4">
        {error && (
          <div className="card bg-red-50 border border-red-200 text-red-700 text-sm">
            {getErrorMessage(error)}
          </div>
        )}
        <div className="card grid md:grid-cols-3 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search flags" className="input" />
          <select value={audience} onChange={(e) => setAudience(e.target.value as Flag['audience'] | 'All')} className="select">
            {['All', 'Admin', 'Operator', 'STATION_OWNER'].map((a) => (
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
                    <button className="btn secondary" onClick={() => toggle(f.key, !f.enabled)} disabled={toggleMutation.isPending}>
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <div className="p-8 text-center text-subtle">Loading feature flags...</div>}
          {!isLoading && rows.length === 0 && <div className="p-8 text-center text-subtle">No flags found.</div>}
        </div>
      </div>
    </DashboardLayout>
  )
}


