import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { getErrorMessage } from '@/core/api/errors'
import { useProviderCompliancePolicy, useUpdateProviderCompliancePolicy } from '@/modules/integrations/useProviders'

/**
 * Global Config Page - Admin feature
 */
export function GlobalConfig() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'globalConfig')

  const [tab, setTab] = useState<'general' | 'features' | 'security' | 'compliance'>('general')

  const [settings, setSettings] = useState({
    siteName: 'EVzone Platform',
    supportEmail: 'support@evzone.com',
    timezone: 'UTC',
    currency: 'USD',
    maintenanceMode: false,
  })

  const [features, setFeatures] = useState({
    darkMode: true,
    betaFeatures: false,
    analyticsEnabled: true,
    roamingEnabled: true,
  })

  const { data: compliancePolicyRecord, isLoading: policyLoading, error: policyError } = useProviderCompliancePolicy({
    enabled: perms.access,
  })
  const updateCompliancePolicyMutation = useUpdateProviderCompliancePolicy()

  const [compliancePolicy, setCompliancePolicy] = useState({
    effectiveDateMode: 'WARN_BEFORE_ENFORCE' as 'WARN_BEFORE_ENFORCE' | 'ENFORCE_NOW',
    roadmapAllowedBeforeEffective: true,
    markets: ['CN', 'HK', 'FI'] as Array<'CN' | 'HK' | 'FI'>,
    hk: {
      dg: {
        requireConfig: true,
        thresholdKwh: '',
      },
    },
  })

  useEffect(() => {
    const policy = compliancePolicyRecord?.data
    if (!policy) return
    setCompliancePolicy({
      effectiveDateMode: policy.effectiveDateMode,
      roadmapAllowedBeforeEffective: policy.roadmapAllowedBeforeEffective,
      markets: policy.markets,
      hk: {
        dg: {
          requireConfig: policy.hk.dg.requireConfig,
          thresholdKwh: policy.hk.dg.thresholdKwh == null ? '' : String(policy.hk.dg.thresholdKwh),
        },
      },
    })
  }, [compliancePolicyRecord])

  const saveCompliancePolicy = async () => {
    await updateCompliancePolicyMutation.mutateAsync({
      effectiveDateMode: compliancePolicy.effectiveDateMode,
      roadmapAllowedBeforeEffective: compliancePolicy.roadmapAllowedBeforeEffective,
      markets: compliancePolicy.markets,
      hk: {
        dg: {
          requireConfig: compliancePolicy.hk.dg.requireConfig,
          thresholdKwh:
            compliancePolicy.hk.dg.thresholdKwh.trim() === ''
              ? null
              : Number(compliancePolicy.hk.dg.thresholdKwh),
        },
      },
    })
  }

  return (
    <DashboardLayout pageTitle="Global Configuration">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-light pb-2 mb-4">
        {(['general', 'features', 'security', 'compliance'] as const).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="card">
          <h3 className="font-semibold text-text mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Site Name</label>
              <input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                disabled={!perms.edit}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Support Email</label>
              <input
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                disabled={!perms.edit}
                className="input w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">Timezone</label>
                <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} disabled={!perms.edit} className="select w-full">
                  <option>UTC</option>
                  <option>Africa/Kampala</option>
                  <option>Europe/Berlin</option>
                  <option>America/New_York</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Currency</label>
                <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} disabled={!perms.edit} className="select w-full">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>UGX</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Maintenance Mode</span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                disabled={!perms.edit}
                className="h-5 w-5"
              />
            </div>
          </div>
          {perms.edit && (
            <button className="btn secondary mt-4" onClick={() => alert('Settings saved (demo)')}>
              Save Changes
            </button>
          )}
        </div>
      )}

      {tab === 'features' && (
        <div className="card">
          <h3 className="font-semibold text-text mb-4">Feature Flags</h3>
          <div className="space-y-4">
            {Object.entries(features).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })}
                  disabled={!perms.edit}
                  className="h-5 w-5"
                />
              </div>
            ))}
          </div>
          {perms.edit && (
            <button className="btn secondary mt-4" onClick={() => alert('Features saved (demo)')}>
              Save Changes
            </button>
          )}
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <h3 className="font-semibold text-text mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Enforce MFA</div>
                <div className="text-xs text-muted">Require MFA for all admin users</div>
              </div>
              <input type="checkbox" disabled={!perms.edit} defaultChecked className="h-5 w-5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Session Timeout</div>
                <div className="text-xs text-muted">Auto-logout after inactivity</div>
              </div>
              <select disabled={!perms.edit} className="select">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>8 hours</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">IP Allowlist</div>
                <div className="text-xs text-muted">Restrict admin access to specific IPs</div>
              </div>
              <button className="btn secondary" disabled={!perms.edit} onClick={() => alert('Configure IPs (demo)')}>
                Configure
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'compliance' && (
        <div className="card">
          <h3 className="font-semibold text-text mb-4">Compliance Policy</h3>
          {policyError && (
            <div className="mb-3 rounded border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">
              {getErrorMessage(policyError)}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Effective Date Mode</label>
              <select
                value={compliancePolicy.effectiveDateMode}
                onChange={(e) =>
                  setCompliancePolicy((prev) => ({
                    ...prev,
                    effectiveDateMode: e.target.value as 'WARN_BEFORE_ENFORCE' | 'ENFORCE_NOW',
                  }))
                }
                disabled={!perms.edit || policyLoading}
                className="select w-full"
              >
                <option value="WARN_BEFORE_ENFORCE">WARN_BEFORE_ENFORCE</option>
                <option value="ENFORCE_NOW">ENFORCE_NOW</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span>Roadmap Allowed Before Effective Date</span>
              <input
                type="checkbox"
                checked={compliancePolicy.roadmapAllowedBeforeEffective}
                onChange={(e) =>
                  setCompliancePolicy((prev) => ({
                    ...prev,
                    roadmapAllowedBeforeEffective: e.target.checked,
                  }))
                }
                disabled={!perms.edit || policyLoading}
                className="h-5 w-5"
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Active Market Packs</label>
              <div className="grid grid-cols-3 gap-3">
                {(['CN', 'HK', 'FI'] as const).map((market) => (
                  <label key={market} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={compliancePolicy.markets.includes(market)}
                      onChange={(e) =>
                        setCompliancePolicy((prev) => ({
                          ...prev,
                          markets: e.target.checked
                            ? Array.from(new Set([...prev.markets, market]))
                            : prev.markets.filter((item) => item !== market),
                        }))
                      }
                      disabled={!perms.edit || policyLoading}
                      className="h-4 w-4"
                    />
                    {market}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded border border-border-light p-3 space-y-3">
              <div className="text-sm font-medium">Hong Kong DG Policy</div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Require threshold configuration</span>
                <input
                  type="checkbox"
                  checked={compliancePolicy.hk.dg.requireConfig}
                  onChange={(e) =>
                    setCompliancePolicy((prev) => ({
                      ...prev,
                      hk: {
                        dg: {
                          ...prev.hk.dg,
                          requireConfig: e.target.checked,
                        },
                      },
                    }))
                  }
                  disabled={!perms.edit || policyLoading}
                  className="h-5 w-5"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">DG threshold (kWh)</label>
                <input
                  value={compliancePolicy.hk.dg.thresholdKwh}
                  onChange={(e) =>
                    setCompliancePolicy((prev) => ({
                      ...prev,
                      hk: {
                        dg: {
                          ...prev.hk.dg,
                          thresholdKwh: e.target.value,
                        },
                      },
                    }))
                  }
                  disabled={!perms.edit || policyLoading}
                  className="input w-full"
                  placeholder="Leave blank to keep unconfigured"
                />
              </div>
            </div>
          </div>

          {perms.edit && (
            <button
              className="btn secondary mt-4"
              disabled={updateCompliancePolicyMutation.isPending || policyLoading}
              onClick={() => {
                void saveCompliancePolicy()
              }}
            >
              {updateCompliancePolicyMutation.isPending ? 'Saving...' : 'Save Compliance Policy'}
            </button>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

