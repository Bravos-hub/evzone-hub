import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { useMe, useGenerate2fa, useVerify2fa, useDisable2fa } from '@/modules/auth/hooks/useAuth'
import { useUpdateMe, useChangePassword, useUploadAvatar } from '@/modules/auth/hooks/useUsers'
import { useApiKeys, useRotateApiKey, useRevokeApiKey } from '@/modules/integrations/useIntegrationKeys'
import { getErrorMessage } from '@/core/api/errors'
import type { ApiKey } from '@/modules/integrations/integrationsService'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

/* Settings - Profile, Security, Notifications, UI Preferences, API, Organization, Team, Billing */

type SettingsTab = 'profile' | 'security' | 'notifications' | 'ui_preferences' | 'api' | 'organization' | 'team' | 'billing'

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
  const { data: me, isLoading: meLoading, error: meError, refetch } = useMe()
  const updateMe = useUpdateMe()
  const changePassword = useChangePassword()
  const uploadAvatar = useUploadAvatar()
  const generate2fa = useGenerate2fa()
  const verify2fa = useVerify2fa()
  const disable2fa = useDisable2fa()

  const resolvedRole = (me || user)?.role
  const canUseApiKeys = resolvedRole === 'EVZONE_ADMIN' || resolvedRole === 'SUPER_ADMIN'

  const { data: apiKeysData, isLoading: apiKeysLoading, error: apiKeysError } = useApiKeys({ enabled: canUseApiKeys })
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
    if (!security.currentPassword || !security.newPassword) {
      toast('Please fill in both current and new passwords.')
      return
    }
    if (security.newPassword !== security.confirmPassword) {
      toast('Passwords do not match!')
      return
    }

    changePassword.mutate(
      { currentPassword: security.currentPassword, newPassword: security.newPassword },
      {
        onSuccess: () => {
          toast('Password changed successfully!')
          setSecurity(s => ({ ...s, currentPassword: '', newPassword: '', confirmPassword: '' }))
        },
        onError: (err) => toast(getErrorMessage(err))
      }
    )
  }

  const [qrCodeData, setQrCodeData] = useState<{ url: string; secret: string } | null>(null)
  const [otpToken, setOtpToken] = useState('')

  const handleToggle2fa = (enable: boolean) => {
    if (enable) {
      generate2fa.mutate(undefined, {
        onSuccess: (data: any) => {
          setQrCodeData({ url: data.qrCodeUrl, secret: data.secret })
        },
        onError: (err) => toast(getErrorMessage(err))
      })
    } else {
      const token = prompt('Enter your 2FA token to disable:')
      if (token) {
        disable2fa.mutate(token, {
          onSuccess: () => {
            toast('2FA disabled successfully!')
            refetch()
          },
          onError: (err) => toast(getErrorMessage(err))
        })
      }
    }
  }

  const handleVerify2fa = () => {
    verify2fa.mutate(otpToken, {
      onSuccess: () => {
        toast('2FA enabled successfully!')
        setQrCodeData(null)
        setOtpToken('')
        refetch()
      },
      onError: (err) => toast(getErrorMessage(err))
    })
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
  })

  // Role-based tab visibility
  const isAdmin = canUseApiKeys
  const isOwner = resolvedUser?.role === 'SITE_OWNER' || resolvedUser?.role === 'STATION_OWNER'
  const isManager = resolvedUser?.role === 'CASHIER' || resolvedUser?.role === 'ATTENDANT' // Assuming managers, but adjust based on actual roles

  const baseTabs: { key: SettingsTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'ui_preferences', label: 'UI Preferences' },
  ]

  if (isAdmin) {
    baseTabs.push({ key: 'api', label: 'API Keys' })
    baseTabs.push({ key: 'organization', label: 'Organization Details' })
    baseTabs.push({ key: 'team', label: 'Team Management' })
  } else if (isOwner) {
    baseTabs.push({ key: 'organization', label: 'Organization Details' })
    baseTabs.push({ key: 'team', label: 'Team Management' })
    baseTabs.push({ key: 'billing', label: 'Billing & Payouts' })
  } else if (isManager) {
    // example, attendants don't see team or billing by default, up to your business logic
  }

  const tabs = baseTabs;

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="space-y-6">
        {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}
        {(meError || (canUseApiKeys && apiKeysError)) && (
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
                  {profile.name ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : '--'}
                </div>
              )}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      uploadAvatar.mutate(file, {
                        onSuccess: () => {
                          toast('Avatar uploaded successfully!')
                          refetch()
                        },
                        onError: (err) => toast(getErrorMessage(err))
                      })
                    }
                  }}
                  title="Upload avatar"
                />
                <button type="button" className="px-3 py-2 rounded-lg border border-border hover:bg-muted pointer-events-none">
                  Upload avatar
                </button>
              </div>
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
                <input
                  type="checkbox"
                  checked={(resolvedUser as any)?.twoFactorEnabled || !!qrCodeData}
                  onChange={e => handleToggle2fa(e.target.checked)}
                  disabled={generate2fa.isPending || disable2fa.isPending}
                  className="rounded"
                />
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-subtle">Add an extra layer of security to your account.</div>
                </div>
              </label>

              {qrCodeData && !(resolvedUser as any)?.twoFactorEnabled && (
                <div className="mt-4 p-4 border border-border rounded-lg bg-muted/20">
                  <h3 className="font-medium mb-2">Scan QR Code</h3>
                  <p className="text-sm text-subtle mb-4">Use an authenticator app (like Google Authenticator or Authy) to scan this QR code.</p>
                  <div className="bg-white p-2 inline-block rounded-md mb-4 border border-border">
                    <img src={qrCodeData.url} alt="2FA QR Code" className="w-32 h-32" />
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-subtle mb-2">Or enter this secret manually:</p>
                    <code className="bg-muted px-2 py-1 rounded select-all">{qrCodeData.secret}</code>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      value={otpToken}
                      onChange={e => setOtpToken(e.target.value)}
                      className="input flex-1 max-w-[200px]"
                    />
                    <button
                      type="button"
                      onClick={handleVerify2fa}
                      disabled={otpToken.length < 6 || verify2fa.isPending}
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover font-medium disabled:opacity-50"
                    >
                      Verify & Enable
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Updating...' : 'Update Password'}
              </button>
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

        {/* UI Preferences Tab */}
        {tab === 'ui_preferences' && (
          <div className="rounded-xl bg-surface border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold">UI Preferences</h2>
            <p className="text-subtle text-sm">Manage your portal appearance and default behaviors.</p>
            <div className="space-y-4 pt-4 border-t border-border">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Theme Mode</span>
                <select className="select w-full max-w-xs">
                  <option value="system">System Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 mt-4">
                <span className="text-sm font-medium">Default Dashboard Date Range</span>
                <select className="select w-full max-w-xs">
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_30_days" selected>Last 30 Days</option>
                  <option value="year_to_date">Year to Date</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end mt-6">
              <button type="button" className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover" onClick={() => toast('Preferences saved!')}>
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Organization Tab */}
        {tab === 'organization' && (
          <div className="rounded-xl bg-surface border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold">Organization Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Organization Name</span>
                <input type="text" defaultValue={(resolvedUser as any)?.organization?.name || ''} className="input" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Support Email</span>
                <input type="email" defaultValue={(resolvedUser as any)?.organization?.supportEmail || ''} className="input" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Tax / VAT ID</span>
                <input type="text" className="input" placeholder="e.g. GB123456789" />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm font-medium">Billing Address</span>
                <textarea className="input resize-none" rows={3}></textarea>
              </label>
            </div>
            <div className="flex justify-end">
              <button type="button" className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover" onClick={() => toast('Organization details saved!')}>
                Save Organization
              </button>
            </div>
          </div>
        )}

        {/* Team Management Tab */}
        {tab === 'team' && (
          <div className="rounded-xl bg-surface border border-border p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Team Management</h2>
              <button className="px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent-hover">Invite Member</button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="p-8 text-center text-muted">
                Team management functionality will live here, allowing you to invite Cashiers and Attendants.
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {tab === 'billing' && (
          <div className="rounded-xl bg-surface border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold">Billing & Payouts</h2>
            <div className="p-4 border border-border rounded-lg bg-muted/20">
              <h3 className="font-medium mb-1">Payout Bank Account</h3>
              <p className="text-sm text-subtle mb-4">Connect your bank account to receive payouts from charging sessions.</p>
              <button className="px-4 py-2 border border-border bg-surface rounded-lg hover:bg-muted font-medium text-sm">
                Connect via Stripe
              </button>
            </div>
            <div className="p-4 border border-border rounded-lg bg-muted/20 mt-4">
              <h3 className="font-medium mb-1">Subscription Details</h3>
              <p className="text-sm text-subtle">You are currently on the <strong>Pro Plan</strong> ($0/mo during beta).</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Settings
