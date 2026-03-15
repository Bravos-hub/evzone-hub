import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { apiClient } from '@/core/api/client'
import { getErrorMessage } from '@/core/api/errors'
import type { Organization, TeamInviteRequest, TeamMember } from '@/core/api/types'
import { queryKeys } from '@/data/queryKeys'
import {
  useMe,
  useGenerate2fa,
  useVerify2fa,
  useDisable2fa,
} from '@/modules/auth/hooks/useAuth'
import {
  useUpdateMe,
  useChangePassword,
  useUploadAvatar,
} from '@/modules/auth/hooks/useUsers'
import {
  useTeamMembers,
  useInviteTeamMember,
} from '@/modules/auth/hooks/useTeamMembers'
import { onboardingService } from '@/modules/auth/services/onboardingService'
import { resolveUserOrgId } from '@/modules/auth/services/userService'
import { useApiKeys, useRotateApiKey, useRevokeApiKey } from '@/modules/integrations/useIntegrationKeys'
import type { ApiKey } from '@/modules/integrations/integrationsService'
import { useReferenceCountries } from '@/modules/geography/hooks/useGeography'
import { useStations } from '@/modules/stations/hooks/useStations'
import { ROLE_LABELS } from '@/constants/roles'
import { InviteMemberModal } from '@/ui/components/InviteMemberModal'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

type SettingsTab =
  | 'profile'
  | 'security'
  | 'notifications'
  | 'ui_preferences'
  | 'api'
  | 'organization'
  | 'team'
  | 'billing'

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
  country: string
}

type UiPreferencesState = {
  themeMode: 'system' | 'light' | 'dark'
  dashboardRange: 'this_week' | 'this_month' | 'last_30_days' | 'year_to_date'
}

type OrganizationFormState = {
  name: string
  regId: string
  taxId: string
  city: string
  address: string
}

type BillingFormState = {
  provider: string
  walletNumber: string
  taxId: string
}

const defaultNotifications: NotificationPrefs = {
  emailAlerts: false,
  pushNotifications: false,
  smsAlerts: false,
  weeklyDigest: false,
  marketingEmails: false,
}

const defaultUiPreferences: UiPreferencesState = {
  themeMode: 'system',
  dashboardRange: 'last_30_days',
}

const fallbackCountryOptions = [
  'Uganda',
  'Kenya',
  'Rwanda',
  'Tanzania',
  'China',
  'United States',
  'United Kingdom',
]

const notificationStorageKey = 'settings.notifications'
const uiPreferencesStorageKey = 'settings.uiPreferences'

const formatDate = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '--'
  return date.toISOString().slice(0, 10)
}

const scopedStorageKey = (base: string, userId?: string) =>
  `${base}:${userId || 'anonymous'}`

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const writeStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // noop
  }
}

const mapProfile = (user?: any): ProfileState => ({
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  country: user?.country || '',
})

const mapOrganizationForm = (organization?: Partial<Organization>): OrganizationFormState => ({
  name: organization?.name || '',
  regId: organization?.regId || '',
  taxId: organization?.taxId || '',
  city: organization?.city || '',
  address: organization?.address || '',
})

const mapBillingForm = (organization?: Partial<Organization>): BillingFormState => ({
  provider: organization?.paymentProvider || '',
  walletNumber: organization?.walletNumber || '',
  taxId: organization?.taxId || '',
})

export function Settings() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { data: me, isLoading: meLoading, error: meError, refetch } = useMe()
  const updateMe = useUpdateMe()
  const changePassword = useChangePassword()
  const uploadAvatar = useUploadAvatar()
  const generate2fa = useGenerate2fa()
  const verify2fa = useVerify2fa()
  const disable2fa = useDisable2fa()

  const resolvedUser = me || user
  const resolvedRole = resolvedUser?.role
  const organizationId = resolveUserOrgId(resolvedUser as any)
  const canUseApiKeys = resolvedRole === 'EVZONE_ADMIN' || resolvedRole === 'SUPER_ADMIN'
  const isOwner =
    resolvedRole === 'SITE_OWNER' || resolvedRole === 'STATION_OWNER'
  const canManageTeam = canUseApiKeys || isOwner

  const [tab, setTab] = useState<SettingsTab>('profile')
  const [ack, setAck] = useState('')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const { data: referenceCountries = [] } = useReferenceCountries()
  const countryOptions = useMemo(() => {
    if (referenceCountries.length === 0) return fallbackCountryOptions
    return referenceCountries.map((country) => country.name)
  }, [referenceCountries])

  const { data: apiKeysData, isLoading: apiKeysLoading, error: apiKeysError } =
    useApiKeys({ enabled: canUseApiKeys })
  const rotateApiKey = useRotateApiKey()
  const revokeApiKey = useRevokeApiKey()

  const organizationQuery = useQuery({
    queryKey: queryKeys.organizations.detail(organizationId || 'none'),
    queryFn: () => apiClient.get<Organization>(`/organizations/${organizationId}`),
    enabled: Boolean(organizationId),
  })

  const { data: teamMembers = [], isLoading: teamLoading, error: teamError } =
    useTeamMembers(canManageTeam && tab === 'team')

  const { data: stations = [] } = useStations(
    { orgId: organizationId || undefined },
    {
      enabled: canManageTeam && (tab === 'team' || isInviteModalOpen) && Boolean(organizationId),
    },
  )
  const inviteTeamMember = useInviteTeamMember()

  const [profile, setProfile] = useState<ProfileState>(() => mapProfile(resolvedUser))
  const [profileDirty, setProfileDirty] = useState(false)

  const [notifications, setNotifications] = useState<NotificationPrefs>(
    defaultNotifications,
  )
  const [notificationsDirty, setNotificationsDirty] = useState(false)

  const [uiPreferences, setUiPreferences] = useState<UiPreferencesState>(
    defaultUiPreferences,
  )
  const [uiPreferencesDirty, setUiPreferencesDirty] = useState(false)

  const [organizationForm, setOrganizationForm] = useState<OrganizationFormState>(
    mapOrganizationForm(),
  )
  const [organizationDirty, setOrganizationDirty] = useState(false)

  const [billingForm, setBillingForm] = useState<BillingFormState>(mapBillingForm())
  const [billingDirty, setBillingDirty] = useState(false)

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [twoFactorPassword, setTwoFactorPassword] = useState('')
  const [disable2faToken, setDisable2faToken] = useState('')
  const [qrCodeData, setQrCodeData] = useState<{ url: string; secret: string } | null>(null)
  const [otpToken, setOtpToken] = useState('')

  const tabs = useMemo<{ key: SettingsTab; label: string }[]>(() => {
    const baseTabs: { key: SettingsTab; label: string }[] = [
      { key: 'profile', label: 'Profile' },
      { key: 'security', label: 'Security' },
      { key: 'notifications', label: 'Notifications' },
      { key: 'ui_preferences', label: 'UI Preferences' },
    ]

    if (canUseApiKeys) {
      baseTabs.push({ key: 'api', label: 'API Keys' })
      baseTabs.push({ key: 'organization', label: 'Organization Details' })
      baseTabs.push({ key: 'team', label: 'Team Management' })
      baseTabs.push({ key: 'billing', label: 'Billing & Payouts' })
    } else if (isOwner) {
      baseTabs.push({ key: 'organization', label: 'Organization Details' })
      baseTabs.push({ key: 'team', label: 'Team Management' })
      baseTabs.push({ key: 'billing', label: 'Billing & Payouts' })
    }

    return baseTabs
  }, [canUseApiKeys, isOwner])

  useEffect(() => {
    if (!tabs.some((item) => item.key === tab)) {
      setTab(tabs[0]?.key || 'profile')
    }
  }, [tab, tabs])

  useEffect(() => {
    if (!profileDirty) {
      setProfile(mapProfile(resolvedUser))
    }
  }, [resolvedUser, profileDirty])

  useEffect(() => {
    if (!organizationDirty) {
      setOrganizationForm(mapOrganizationForm(organizationQuery.data))
    }
  }, [organizationQuery.data, organizationDirty])

  useEffect(() => {
    if (!billingDirty) {
      setBillingForm(mapBillingForm(organizationQuery.data))
    }
  }, [organizationQuery.data, billingDirty])

  useEffect(() => {
    const scopedNotificationsKey = scopedStorageKey(
      notificationStorageKey,
      resolvedUser?.id,
    )
    const scopedUiPrefsKey = scopedStorageKey(uiPreferencesStorageKey, resolvedUser?.id)
    setNotifications(readStorage(scopedNotificationsKey, defaultNotifications))
    setUiPreferences(readStorage(scopedUiPrefsKey, defaultUiPreferences))
    setNotificationsDirty(false)
    setUiPreferencesDirty(false)
  }, [resolvedUser?.id])

  const apiKeys = useMemo<ApiKey[]>(() => {
    if (Array.isArray(apiKeysData)) return apiKeysData
    return (apiKeysData as any)?.data || []
  }, [apiKeysData])

  const toast = (message: string) => {
    setAck(message)
    setTimeout(() => setAck(''), 2400)
  }

  const updateOrganization = useMutation({
    mutationFn: async (payload: Partial<Organization>) => {
      if (!organizationId) throw new Error('No active organization context found.')
      return apiClient.patch<Organization>(`/organizations/${organizationId}`, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(organizationId || ''),
      })
      toast('Organization details saved.')
      setOrganizationDirty(false)
    },
    onError: (error) => toast(getErrorMessage(error)),
  })

  const updateBilling = useMutation({
    mutationFn: async (payload: BillingFormState) => {
      if (!organizationId) throw new Error('No active organization context found.')
      return onboardingService.setupPayouts(organizationId, {
        provider: payload.provider,
        walletNumber: payload.walletNumber,
        taxId: payload.taxId || undefined,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(organizationId || ''),
      })
      toast('Billing and payout details saved.')
      setBillingDirty(false)
    },
    onError: (error) => toast(getErrorMessage(error)),
  })

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateMe.mutate(
      {
        name: profile.name || undefined,
        phone: profile.phone || undefined,
        country: profile.country || undefined,
      } as any,
      {
        onSuccess: () => {
          toast('Profile saved successfully.')
          setProfileDirty(false)
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )
  }

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!security.currentPassword || !security.newPassword) {
      toast('Please fill in both current and new passwords.')
      return
    }
    if (security.newPassword !== security.confirmPassword) {
      toast('Passwords do not match.')
      return
    }

    changePassword.mutate(
      {
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      },
      {
        onSuccess: () => {
          toast('Password changed successfully.')
          setSecurity({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          })
        },
        onError: (error) => toast(getErrorMessage(error)),
      },
    )
  }

  const handleToggle2fa = (enable: boolean) => {
    const twoFactorEnabled = Boolean((resolvedUser as any)?.twoFactorEnabled)

    if (!enable && !twoFactorEnabled && qrCodeData) {
      setQrCodeData(null)
      setOtpToken('')
      return
    }

    if (!twoFactorPassword) {
      toast('Enter your current password to manage 2FA.')
      return
    }

    if (enable) {
      generate2fa.mutate(twoFactorPassword, {
        onSuccess: (data: any) => {
          setQrCodeData({ url: data.qrCodeUrl, secret: data.secret })
          setDisable2faToken('')
        },
        onError: (error) => toast(getErrorMessage(error)),
      })
      return
    }

    if (!disable2faToken || disable2faToken.length < 6) {
      toast('Enter a valid 6-digit authenticator code to disable 2FA.')
      return
    }

    disable2fa.mutate(
      { token: disable2faToken, currentPassword: twoFactorPassword },
      {
      onSuccess: () => {
        toast('2FA disabled successfully.')
        setDisable2faToken('')
        setQrCodeData(null)
        setOtpToken('')
        refetch()
      },
      onError: (error) => toast(getErrorMessage(error)),
      },
    )
  }

  const handleVerify2fa = () => {
    verify2fa.mutate(otpToken, {
      onSuccess: () => {
        toast('2FA enabled successfully.')
        setQrCodeData(null)
        setOtpToken('')
        setDisable2faToken('')
        refetch()
      },
      onError: (error) => toast(getErrorMessage(error)),
    })
  }

  const handleNotificationsSave = () => {
    writeStorage(
      scopedStorageKey(notificationStorageKey, resolvedUser?.id),
      notifications,
    )
    setNotificationsDirty(false)
    toast('Notification preferences saved on this device.')
  }

  const handleUiPreferencesSave = () => {
    writeStorage(
      scopedStorageKey(uiPreferencesStorageKey, resolvedUser?.id),
      uiPreferences,
    )
    setUiPreferencesDirty(false)
    toast('UI preferences saved on this device.')
  }

  const handleInviteMember = async (payload: TeamInviteRequest) => {
    try {
      await inviteTeamMember.mutateAsync(payload)
      toast('Team invitation sent.')
      setIsInviteModalOpen(false)
    } catch (error) {
      toast(getErrorMessage(error))
    }
  }

  const criticalError = meError || (canUseApiKeys && apiKeysError)
  const secondaryError = organizationQuery.error || teamError

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="space-y-6 pb-24">
        {ack && (
          <div className="rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent">
            {ack}
          </div>
        )}

        {criticalError && (
          <div className="card border border-red-200 bg-red-50 text-sm text-red-700">
            {getErrorMessage(criticalError)}
          </div>
        )}

        {secondaryError && (
          <div className="card border border-amber-200 bg-amber-50 text-sm text-amber-700">
            {getErrorMessage(secondaryError)}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto border-b border-border pb-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`shrink-0 rounded-t-lg px-4 py-2 font-medium transition-colors ${
                tab === item.key ? 'bg-accent text-white' : 'hover:bg-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <form
            onSubmit={handleProfileSave}
            className="space-y-6 rounded-xl border border-border bg-surface p-6"
          >
            <h2 className="text-lg font-semibold">Profile Information</h2>

            {meLoading && (
              <div className="py-2">
                <TextSkeleton lines={2} />
              </div>
            )}

            <div className="flex items-center gap-4">
              {resolvedUser?.avatarUrl ? (
                <img
                  src={resolvedUser.avatarUrl}
                  alt={resolvedUser.name || 'Avatar'}
                  className="h-16 w-16 rounded-full border-2 border-accent/20 object-cover"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-sm text-subtle">
                  {profile.name
                    ? profile.name
                        .split(' ')
                        .map((part: string) => part[0])
                        .join('')
                        .slice(0, 2)
                    : '--'}
                </div>
              )}

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    uploadAvatar.mutate(file, {
                      onSuccess: () => {
                        toast('Avatar uploaded successfully.')
                        refetch()
                      },
                      onError: (error) => toast(getErrorMessage(error)),
                    })
                  }}
                  title="Upload avatar"
                />
                <button
                  type="button"
                  className="pointer-events-none rounded-lg border border-border px-3 py-2 hover:bg-muted"
                >
                  {uploadAvatar.isPending ? 'Uploading...' : 'Upload avatar'}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Full Name</span>
                <input
                  value={profile.name}
                  onChange={(e) => {
                    setProfile((prev) => ({ ...prev, name: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="input"
                  disabled={meLoading || updateMe.isPending}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Email</span>
                <input
                  type="email"
                  value={profile.email}
                  className="input bg-muted/30"
                  disabled
                />
                <span className="text-xs text-subtle">
                  Email changes are currently managed by account administration.
                </span>
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Phone</span>
                <input
                  value={profile.phone}
                  onChange={(e) => {
                    setProfile((prev) => ({ ...prev, phone: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="input"
                  disabled={meLoading || updateMe.isPending}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Country</span>
                <select
                  value={profile.country}
                  onChange={(e) => {
                    setProfile((prev) => ({ ...prev, country: e.target.value }))
                    setProfileDirty(true)
                  }}
                  className="select"
                  disabled={meLoading || updateMe.isPending}
                >
                  <option value="">Select country</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                disabled={!profileDirty || updateMe.isPending}
              >
                {updateMe.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
        {tab === 'security' && (
          <form
            onSubmit={handleSecuritySave}
            className="space-y-6 rounded-xl border border-border bg-surface p-6"
          >
            <h2 className="text-lg font-semibold">Security Settings</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm font-medium">Current Password</span>
                <input
                  type="password"
                  value={security.currentPassword}
                  onChange={(e) =>
                    setSecurity((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="input"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">New Password</span>
                <input
                  type="password"
                  value={security.newPassword}
                  onChange={(e) =>
                    setSecurity((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  className="input"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Confirm New Password</span>
                <input
                  type="password"
                  value={security.confirmPassword}
                  onChange={(e) =>
                    setSecurity((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="input"
                />
              </label>
            </div>

            <div className="border-t border-border pt-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={(resolvedUser as any)?.twoFactorEnabled || !!qrCodeData}
                  onChange={(e) => handleToggle2fa(e.target.checked)}
                  disabled={generate2fa.isPending || disable2fa.isPending}
                  className="rounded"
                />
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-subtle">
                    Add an extra layer of security to your account.
                  </div>
                </div>
              </label>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Current Password (required for 2FA changes)</span>
                  <input
                    type="password"
                    value={twoFactorPassword}
                    onChange={(e) => setTwoFactorPassword(e.target.value)}
                    className="input"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </label>

                {(resolvedUser as any)?.twoFactorEnabled && (
                  <label className="grid gap-1">
                    <span className="text-sm font-medium">Authenticator Code (for disable)</span>
                    <input
                      type="text"
                      value={disable2faToken}
                      onChange={(e) =>
                        setDisable2faToken(
                          e.target.value.replace(/\D/g, '').slice(0, 6),
                        )
                      }
                      className="input"
                      inputMode="numeric"
                      placeholder="Enter 6-digit code"
                    />
                  </label>
                )}
              </div>

              <p className="mt-3 text-xs text-subtle">
                Make sure you keep access to your authenticator device before enabling 2FA.
                Recovery codes are not yet available in this portal, so contact support immediately if you lose access.
              </p>

              {(resolvedUser as any)?.twoFactorEnabled && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleToggle2fa(false)}
                    disabled={disable2fa.isPending}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {disable2fa.isPending ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </div>
              )}

              {qrCodeData && !(resolvedUser as any)?.twoFactorEnabled && (
                <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="mb-2 font-medium">Scan QR Code</h3>
                  <p className="mb-4 text-sm text-subtle">
                    Use Google Authenticator, Authy, or another authenticator app.
                  </p>
                  <div className="mb-4 inline-block rounded-md border border-border bg-white p-2">
                    <img src={qrCodeData.url} alt="2FA QR Code" className="h-32 w-32" />
                  </div>
                  <p className="mb-2 text-sm text-subtle">Manual secret:</p>
                  <code className="select-all rounded bg-muted px-2 py-1">
                    {qrCodeData.secret}
                  </code>

                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      className="input max-w-[220px] flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleVerify2fa}
                      disabled={otpToken.length < 6 || verify2fa.isPending}
                      className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                    >
                      {verify2fa.isPending ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                disabled={changePassword.isPending}
              >
                {changePassword.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
        {tab === 'notifications' && (
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="text-sm text-subtle">
              Preferences are currently saved per account on this browser session.
            </p>

            <div className="space-y-4">
              {[
                {
                  key: 'emailAlerts',
                  label: 'Email Alerts',
                  desc: 'Receive important alerts via email',
                },
                {
                  key: 'pushNotifications',
                  label: 'Push Notifications',
                  desc: 'Receive push notifications in browser',
                },
                {
                  key: 'smsAlerts',
                  label: 'SMS Alerts',
                  desc: 'Receive critical alerts via SMS',
                },
                {
                  key: 'weeklyDigest',
                  label: 'Weekly Digest',
                  desc: 'Receive a weekly summary email',
                },
                {
                  key: 'marketingEmails',
                  label: 'Marketing Emails',
                  desc: 'Receive product updates and offers',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-subtle">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof NotificationPrefs]}
                    onChange={(e) => {
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                      setNotificationsDirty(true)
                    }}
                    className="h-5 w-5 rounded"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNotificationsSave}
                className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                disabled={!notificationsDirty}
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
        {tab === 'api' && canUseApiKeys && (
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
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
                  {apiKeys.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{item.name || item.id}</td>
                      <td className="px-4 py-3 font-mono text-subtle">
                        {item.prefix ? `${item.prefix}****` : '****'}
                      </td>
                      <td className="px-4 py-3 text-subtle">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3 text-subtle">{formatDate(item.lastUsedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => {
                              if (item.prefix) navigator?.clipboard?.writeText?.(item.prefix)
                              toast('Copied to clipboard.')
                            }}
                            className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() =>
                              rotateApiKey.mutate(item.id, {
                                onSuccess: () => toast('API key rotated.'),
                                onError: (error) => toast(getErrorMessage(error)),
                              })
                            }
                            className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                          >
                            Rotate
                          </button>
                          <button
                            onClick={() =>
                              revokeApiKey.mutate(item.id, {
                                onSuccess: () => toast('API key revoked.'),
                                onError: (error) => toast(getErrorMessage(error)),
                              })
                            }
                            className="rounded border border-border px-2 py-1 text-xs text-red-600 hover:bg-muted"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!apiKeysLoading && apiKeys.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted">
                        No API keys found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'ui_preferences' && (
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">UI Preferences</h2>
            <p className="text-sm text-subtle">
              Manage portal behavior defaults. Preferences are saved per browser.
            </p>

            <div className="space-y-4 border-t border-border pt-4">
              <label className="flex max-w-xs flex-col gap-1">
                <span className="text-sm font-medium">Theme Mode</span>
                <select
                  value={uiPreferences.themeMode}
                  onChange={(e) => {
                    setUiPreferences((prev) => ({
                      ...prev,
                      themeMode: e.target.value as UiPreferencesState['themeMode'],
                    }))
                    setUiPreferencesDirty(true)
                  }}
                  className="select w-full"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </label>

              <label className="mt-4 flex max-w-xs flex-col gap-1">
                <span className="text-sm font-medium">Default Dashboard Date Range</span>
                <select
                  value={uiPreferences.dashboardRange}
                  onChange={(e) => {
                    setUiPreferences((prev) => ({
                      ...prev,
                      dashboardRange:
                        e.target.value as UiPreferencesState['dashboardRange'],
                    }))
                    setUiPreferencesDirty(true)
                  }}
                  className="select w-full"
                >
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="year_to_date">Year to Date</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                onClick={handleUiPreferencesSave}
                disabled={!uiPreferencesDirty}
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
        {tab === 'organization' && (
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Organization Details</h2>

            {!organizationId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                No active organization was found for this account.
              </div>
            )}

            {organizationQuery.isLoading && organizationId && (
              <div className="py-2">
                <TextSkeleton lines={2} />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Organization Name</span>
                <input
                  type="text"
                  value={organizationForm.name}
                  onChange={(e) => {
                    setOrganizationForm((prev) => ({ ...prev, name: e.target.value }))
                    setOrganizationDirty(true)
                  }}
                  className="input"
                  disabled={!organizationId || updateOrganization.isPending}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Business Registration ID</span>
                <input
                  type="text"
                  value={organizationForm.regId}
                  onChange={(e) => {
                    setOrganizationForm((prev) => ({ ...prev, regId: e.target.value }))
                    setOrganizationDirty(true)
                  }}
                  className="input"
                  disabled={!organizationId || updateOrganization.isPending}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Tax / VAT ID</span>
                <input
                  type="text"
                  value={organizationForm.taxId}
                  onChange={(e) => {
                    setOrganizationForm((prev) => ({ ...prev, taxId: e.target.value }))
                    setOrganizationDirty(true)
                  }}
                  className="input"
                  placeholder="e.g. GB123456789"
                  disabled={!organizationId || updateOrganization.isPending}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">City</span>
                <input
                  type="text"
                  value={organizationForm.city}
                  onChange={(e) => {
                    setOrganizationForm((prev) => ({ ...prev, city: e.target.value }))
                    setOrganizationDirty(true)
                  }}
                  className="input"
                  disabled={!organizationId || updateOrganization.isPending}
                />
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm font-medium">Billing Address</span>
                <textarea
                  value={organizationForm.address}
                  onChange={(e) => {
                    setOrganizationForm((prev) => ({ ...prev, address: e.target.value }))
                    setOrganizationDirty(true)
                  }}
                  className="input resize-none"
                  rows={3}
                  disabled={!organizationId || updateOrganization.isPending}
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                disabled={!organizationId || !organizationDirty || updateOrganization.isPending}
                onClick={() =>
                  updateOrganization.mutate({
                    name: organizationForm.name || undefined,
                    regId: organizationForm.regId || undefined,
                    taxId: organizationForm.taxId || undefined,
                    city: organizationForm.city || undefined,
                    address: organizationForm.address || undefined,
                  })
                }
              >
                {updateOrganization.isPending ? 'Saving...' : 'Save Organization'}
              </button>
            </div>
          </div>
        )}
        {tab === 'team' && (
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Team Management</h2>
              <button
                className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
                onClick={() => setIsInviteModalOpen(true)}
                disabled={!canManageTeam || !organizationId || inviteTeamMember.isPending}
              >
                Invite Member
              </button>
            </div>

            {!canManageTeam && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Team management is not available for your account role.
              </div>
            )}

            {teamLoading && canManageTeam && (
              <div className="py-2">
                <TextSkeleton lines={2} />
              </div>
            )}

            {canManageTeam && !teamLoading && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-subtle">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Member</th>
                      <th className="px-4 py-3 text-left font-medium">Role</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Assignments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {teamMembers.map((member: TeamMember) => (
                      <tr key={member.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-subtle">
                            {member.email || member.phone || '--'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {member.customRoleName ||
                            ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ||
                            member.role}
                        </td>
                        <td className="px-4 py-3">
                          {member.displayStatus || member.status || '--'}
                        </td>
                        <td className="px-4 py-3">{member.activeAssignments ?? 0}</td>
                      </tr>
                    ))}
                    {!teamLoading && teamMembers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-muted">
                          No team members yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {tab === 'billing' && (
          <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Billing & Payouts</h2>

            {!organizationId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                No active organization was found for payout configuration.
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="mb-1 font-medium">Payout Account</h3>
              <p className="mb-4 text-sm text-subtle">
                Configure payout provider and destination for charging-session settlements.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Provider</span>
                  <select
                    value={billingForm.provider}
                    onChange={(e) => {
                      setBillingForm((prev) => ({ ...prev, provider: e.target.value }))
                      setBillingDirty(true)
                    }}
                    className="select"
                    disabled={!organizationId || updateBilling.isPending}
                  >
                    <option value="">Select provider</option>
                    <option value="MTN">MTN</option>
                    <option value="AIRTEL">Airtel</option>
                    <option value="M-PESA">M-Pesa</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="text-sm font-medium">Wallet / Account Number</span>
                  <input
                    type="text"
                    value={billingForm.walletNumber}
                    onChange={(e) => {
                      setBillingForm((prev) => ({
                        ...prev,
                        walletNumber: e.target.value,
                      }))
                      setBillingDirty(true)
                    }}
                    className="input"
                    disabled={!organizationId || updateBilling.isPending}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm font-medium">Tax ID</span>
                  <input
                    type="text"
                    value={billingForm.taxId}
                    onChange={(e) => {
                      setBillingForm((prev) => ({ ...prev, taxId: e.target.value }))
                      setBillingDirty(true)
                    }}
                    className="input"
                    disabled={!organizationId || updateBilling.isPending}
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
                  disabled={
                    !organizationId ||
                    !billingDirty ||
                    !billingForm.provider ||
                    !billingForm.walletNumber ||
                    updateBilling.isPending
                  }
                  onClick={() => updateBilling.mutate(billingForm)}
                >
                  {updateBilling.isPending ? 'Saving...' : 'Save Billing & Payouts'}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="mb-1 font-medium">Subscription Details</h3>
              <p className="text-sm text-subtle">
                You are currently on the <strong>Pro Plan</strong> ($0/mo during beta).
              </p>
            </div>
          </div>
        )}
      </div>

      {isInviteModalOpen && canManageTeam && (
        <InviteMemberModal
          onClose={() => setIsInviteModalOpen(false)}
          stations={stations.map((station) => ({ id: station.id, name: station.name }))}
          customRoles={[]}
          defaultRegion={resolvedUser?.region}
          defaultZoneId={resolvedUser?.zoneId}
          onInvite={handleInviteMember}
        />
      )}
    </DashboardLayout>
  )
}

export default Settings
