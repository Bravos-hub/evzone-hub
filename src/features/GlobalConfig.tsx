import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

/**
 * Global Config Page - Admin feature
 */
export function GlobalConfig() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'globalConfig')

  const [tab, setTab] = useState<'general' | 'features' | 'security'>('general')

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

  return (
    <DashboardLayout pageTitle="Global Configuration">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-light pb-2 mb-4">
        {(['general', 'features', 'security'] as const).map((t) => (
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
    </DashboardLayout>
  )
}

