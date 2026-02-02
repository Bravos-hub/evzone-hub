import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { useUpdateMe } from '@/modules/auth/hooks/useUsers'
import { useApiKeys, useRotateApiKey, useRevokeApiKey } from '@/modules/integrations/useIntegrationKeys'
import { getErrorMessage } from '@/core/api/errors'
import type { ApiKey } from '@/modules/integrations/integrationsService'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

/* Settings - Profile, Security, Notifications, API, Localization */

type SettingsTab = 'profile' | 'security' | 'notifications' | 'api' | 'localization'

type NotificationPrefs = {
  emailAlerts: boolean
  pushNotifications: boolean
  smsAlerts: boolean
  weeklyDigest: boolean
  marketingEmails: boolean
}

type ProfileState = {
  name: string
  email: string
  phone: string
  company: string
  title: string
  country: string
  city: string
  language: string
  timezone: string
}

const defaultNotifications: NotificationPrefs = {
  emailAlerts: false,
  pushNotifications: false,
  smsAlerts: false,
  weeklyDigest: false,
  marketingEmails: false,
}

const formatDate = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '--'
  return date.toISOString().slice(0, 10)
}

const mapProfile = (user?: any): ProfileState => ({
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  company: user?.company || user?.organizationName || '',
  title: user?.title || '',
  country: user?.country || '',
  city: user?.city || '',
  language: user?.language || user?.locale || '',
  timezone: user?.timezone || '',
})

const mapNotifications = (user?: any): NotificationPrefs => ({
  ...defaultNotifications,
  ...(user?.notificationPreferences || user?.preferences?.notifications || {}),
})

export function Settings() {
  const { user } = useAuthStore()
  const { data: me, isLoading: meLoading, error: meError } = useMe()
  const updateMe = useUpdateMe()

  const { data: apiKeysData, isLoading: apiKeysLoading, error: apiKeysError } = useApiKeys()
  const rotateApiKey = useRotateApiKey()
  const revokeApiKey = useRevokeApiKey()

  const [tab, setTab] = useState<SettingsTab>('profile')
  const [ack, setAck] = useState('')

  const resolvedUser = me || user

  const [profile, setProfile] = useState<ProfileState>(() => mapProfile(resolvedUser))
  const [profileDirty, setProfileDirty] = useState(false)

  const [notifications, setNotifications] = useState<NotificationPrefs>(() => mapNotifications(resolvedUser))
  const [notificationsDirty, setNotificationsDirty] = useState(false)

  useEffect(() => {
    if (!profileDirty) {
      setProfile(mapProfile(resolvedUser))
    }
  }, [resolvedUser, profileDirty])

  useEffect(() => {
    if (!notificationsDirty) {
      setNotifications(mapNotifications(resolvedUser))
    }
  }, [resolvedUser, notificationsDirty])

  const apiKeys = useMemo<ApiKey[]>(() => {
    if (Array.isArray(apiKeysData)) return apiKeysData
    return (apiKeysData as any)?.data || []
  }, [apiKeysData])

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateMe.mutate(
      {
        name: profile.name || undefined,
        email: profile.email || undefined,
        phone: profile.phone || undefined,
        company: profile.company || undefined,
        title: profile.title || undefined,
        country: profile.country || undefined,
        city: profile.city || undefined,
        language: profile.language || undefined,
        timezone: profile.timezone || undefined,
      } as any,
      {
        onSuccess: () => {
          toast('Profile saved successfully!')
          setProfileDirty(false)
        },
        onError: (err) => toast(getErrorMessage(err))
      }
    )
  }

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault()
    if (security.newPassword !== security.confirmPassword) {
      toast('Passwords do not match!')
      return
    }
    toast('Password updates are managed via the reset password flow.')
    setSecurity(s => ({ ...s, currentPassword: '', newPassword: '', confirmPassword: '' }))
  }

  const handleNotificationsSave = () => {
    updateMe.mutate(
      { notificationPreferences: notifications } as any,
      {
        onSuccess: () => {
          toast('Notification preferences saved!')
          setNotificationsDirty(false)
        },
        onError: (err) => toast(getErrorMessage(err))
      }
    )
  }

  const handleLocalizationSave = () => {
    updateMe.mutate(
      {
        language: profile.language || undefined,
        timezone: profile.timezone || undefined,
        country: profile.country || undefined,
        city: profile.city || undefined,
      } as any,
      {
        onSuccess: () => toast('Localization settings saved!'),
        onError: (err) => toast(getErrorMessage(err))
      }
    )
  }

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
  })

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'api', label: 'API Keys' },
    { key: 'localization', label: 'Localization' },
  ]

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="space-y-6">
        {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}
        {(meError || apiKeysError) && (
          <div className="card mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">
            {getErrorMessage(meError || apiKeysError)}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${tab === t.key ? 'bg-accent text-white' : 'hover:bg-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <form onSubmit={handleProfileSave} className="rounded-xl bg-surface border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold">Profile Information</h2>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              {resolvedUser?.avatarUrl ? (
                <img src={resolvedUser.avatarUrl} alt={resolvedUser.name} className="h-16 w-16 rounded-full object-cover border-2 border-accent/20" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted grid place-items-center text-subtle text-sm">
                  {profile.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '--'}
                </div>
              )}
              <button type="button" className="px-3 py-2 rounded-lg border border-border hover:bg-muted" disabled>
                Upload avatar
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Full Name</span>
                <input
                  value={profile.name}
                  onChange={e => {
                    setProfile(p => ({ ...p, name: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="input"
                  disabled={meLoading}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Email</span>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => {
                    setProfile(p => ({ ...p, email: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="input"
                  disabled={meLoading}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Phone</span>
                <input
                  value={profile.phone}
                  onChange={e => {
                    setProfile(p => ({ ...p, phone: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="input"
                  disabled={meLoading}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Company</span>
                <input
                  value={profile.company}
                  onChange={e => {
                    setProfile(p => ({ ...p, company: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="input"
                  disabled={meLoading}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Title</span>
                <input
                  value={profile.title}
                  onChange={e => {
                    setProfile(p => ({ ...p, title: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="input"
                  disabled={meLoading}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Country</span>
                <select
                  value={profile.country}
                  onChange={e => {
                    setProfile(p => ({ ...p, country: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="select"
                  disabled={meLoading}
                >
                  <option value="">Select country</option>
                  {['Uganda', 'Kenya', 'Rwanda', 'Tanzania', 'China', 'United States', 'United Kingdom'].map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">City</span>
                <input
                  value={profile.city}
                  onChange={e => {
                    setProfile(p => ({ ...p, city: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="input"
                  disabled={meLoading}
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover" disabled={updateMe.isPending}>
                {updateMe.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <form onSubmit={handleSecuritySave} className="rounded-xl bg-surface border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold">Security Settings</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm font-medium">Current Password</span>
                <input type="password" value={security.currentPassword} onChange={e => setSecurity(s => ({ ...s, currentPassword: e.target.value }))} className="input" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">New Password</span>
                <input type="password" value={security.newPassword} onChange={e => setSecurity(s => ({ ...s, newPassword: e.target.value }))} className="input" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Confirm New Password</span>
                <input type="password" value={security.confirmPassword} onChange={e => setSecurity(s => ({ ...s, confirmPassword: e.target.value }))} className="input" />
              </label>
            </div>

            <div className="border-t border-border pt-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={security.twoFactor} onChange={e => setSecurity(s => ({ ...s, twoFactor: e.target.checked }))} className="rounded" />
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-subtle">Add an extra layer of security to your account</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">Update Security</button>
            </div>
          </form>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <div className="rounded-xl bg-surface border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold">Notification Preferences</h2>

            <div className="space-y-4">
              {[
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important alerts via email' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
                { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive critical alerts via SMS' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary email' },
                { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive product updates and offers' },
              ].map(n => (
                <label key={n.key} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted">
                  <div>
                    <div className="font-medium">{n.label}</div>
                    <div className="text-sm text-subtle">{n.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[n.key as keyof typeof notifications]}
                    onChange={e => {
                      setNotifications(prev => ({ ...prev, [n.key]: e.target.checked }))
                      setNotificationsDirty(true)
                    }}
                    className="rounded h-5 w-5"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={handleNotificationsSave} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover" disabled={updateMe.isPending}>
                {updateMe.isPending ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {tab === 'api' && (
          <div className="rounded-xl bg-surface border border-border p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">API Keys</h2>
            </div>

            {apiKeysLoading && (
              <div className="py-2">
                <TextSkeleton lines={1} />
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted text-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Key</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    <th className="px-4 py-3 text-left font-medium">Last Used</th>
                    <th className="px-4 py-3 !text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {apiKeys.map(k => (
                    <tr key={k.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{k.name || k.id}</td>
                      <td className="px-4 py-3 font-mono text-subtle">{k.prefix ? `${k.prefix}****` : '****'}</td>
                      <td className="px-4 py-3 text-subtle">{formatDate(k.createdAt)}</td>
                      <td className="px-4 py-3 text-subtle">{formatDate(k.lastUsedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => {
                              if (k.prefix) {
                                navigator?.clipboard?.writeText?.(k.prefix)
                              }
                              toast('Copied to clipboard!')
                            }}
                            className="px-2 py-1 rounded border border-border hover:bg-muted text-xs"
                          >
                            Copy
                          </button>
                          {(resolvedUser?.role === 'EVZONE_ADMIN' || resolvedUser?.role === 'SUPER_ADMIN') && (
                            <>
                              <button
                                onClick={() => rotateApiKey.mutate(k.id, { onSuccess: () => toast('API key rotated') })}
                                className="px-2 py-1 rounded border border-border hover:bg-muted text-xs"
                              >
                                Rotate
                              </button>
                              <button
                                onClick={() => revokeApiKey.mutate(k.id, { onSuccess: () => toast('API key revoked') })}
                                className="px-2 py-1 rounded border border-border hover:bg-muted text-xs text-red-600"
                              >
                                Revoke
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!apiKeysLoading && apiKeys.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted">No API keys found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Localization Tab */}
        {tab === 'localization' && (
          <div className="rounded-xl bg-surface border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold">Localization</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Language</span>
                <select value={profile.language} onChange={e => {
                  setProfile(p => ({ ...p, language: e.target.value }))
                  setProfileDirty(true)
                }} className="select">
                  <option value="">Not set</option>
                  {['EN', 'FR', 'ES', 'SW', 'AR', 'ZH'].map(l => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Timezone</span>
                <select value={profile.timezone} onChange={e => {
                  setProfile(p => ({ ...p, timezone: e.target.value }))
                  setProfileDirty(true)
                }} className="select">
                  <option value="">Not set</option>
                  {['Africa/Kampala', 'Africa/Nairobi', 'Europe/London', 'America/New_York', 'Asia/Shanghai'].map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Date Format</span>
                <select className="select" defaultValue="">
                  <option value="">Not set</option>
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Currency</span>
                <select className="select" defaultValue="">
                  <option value="">Not set</option>
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                  <option>UGX - Ugandan Shilling</option>
                  <option>KES - Kenyan Shilling</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end">
              <button onClick={handleLocalizationSave} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover" disabled={updateMe.isPending}>
                {updateMe.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Settings
