import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { ROLE_LABELS, ALL_ROLES } from '@/constants/roles'
import type { Role } from '@/core/auth/types'
import { RolePill } from '@/ui/components/RolePill'

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockUserDetails = {
  'USR-001': {
    id: 'USR-001',
    name: 'Sarah Chen',
    email: 'sarah@evzone.com',
    role: 'EVZONE_ADMIN' as Role,
    status: 'Active',
    region: 'ALL',
    orgId: 'EVZONE',
    lastLogin: '2m ago',
    createdAt: '2024-01-15',
    mfaEnabled: true,
    phone: '+1 555-0100',
    timezone: 'UTC',
    sessions: 3,
    auditLog: [
      { when: '2m ago', event: 'Login', details: 'Chrome on MacOS' },
      { when: '1h ago', event: 'Config changed', details: 'Updated feature flags' },
      { when: 'Yesterday', event: 'Login', details: 'Chrome on MacOS' },
    ],
  },
  'USR-003': {
    id: 'USR-003',
    name: 'James Owner',
    email: 'james@voltmobility.com',
    role: 'OWNER' as Role,
    status: 'Active',
    region: 'AFRICA',
    orgId: 'Volt Mobility',
    lastLogin: '3h ago',
    createdAt: '2024-03-01',
    mfaEnabled: false,
    phone: '+256 700 000000',
    timezone: 'Africa/Kampala',
    sessions: 1,
    auditLog: [
      { when: '3h ago', event: 'Login', details: 'Safari on iPhone' },
      { when: '1d ago', event: 'Tariff updated', details: 'Station ST-0001' },
    ],
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * User Detail Page - Admin only
 */
export function UserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const nav = useNavigate()
  const { user: currentUser, startImpersonation } = useAuthStore()
  const perms = getPermissionsForFeature(currentUser?.role, 'users')

  const [tab, setTab] = useState<'profile' | 'security' | 'activity'>('profile')
  const [busy, setBusy] = useState(false)

  // Get user data (mock)
  const userData = userId ? mockUserDetails[userId as keyof typeof mockUserDetails] : null

  if (!userData) {
    return (
      <DashboardLayout pageTitle="User Not Found">
        <div className="card">
          <p className="text-muted">User not found or you don't have access.</p>
          <button className="btn secondary mt-4" onClick={() => nav('/users')}>
            Back to Users
          </button>
        </div>
      </DashboardLayout>
    )
  }

  function statusColor(s: string) {
    switch (s) {
      case 'Active': return 'approved'
      case 'Pending': return 'pending'
      case 'Suspended': return 'rejected'
      default: return 'sendback'
    }
  }

  async function handleImpersonate() {
    if (!userData) return
    setBusy(true)
    await new Promise((r) => setTimeout(r, 300))
    startImpersonation(
      {
        id: userData.id,
        name: userData.name,
        role: userData.role,
      },
      '/users'
    )
    nav('/dashboard')
  }

  async function handleSuspend() {
    if (!userData) return
    setBusy(true)
    await new Promise((r) => setTimeout(r, 300))
    alert(`User ${userData.name} suspended (demo)`)
    setBusy(false)
  }

  async function handleResetPassword() {
    if (!userData) return
    setBusy(true)
    await new Promise((r) => setTimeout(r, 300))
    alert(`Password reset email sent to ${userData.email} (demo)`)
    setBusy(false)
  }

  async function handleForceLogout() {
    if (!userData) return
    setBusy(true)
    await new Promise((r) => setTimeout(r, 300))
    alert(`All sessions for ${userData.name} terminated (demo)`)
    setBusy(false)
  }

  return (
    <DashboardLayout pageTitle={`User: ${userData.name}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{userData.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-muted">{userData.email}</span>
            <RolePill role={userData.role} />
            <span className={`pill ${statusColor(userData.status)}`}>{userData.status}</span>
          </div>
        </div>
        <button className="btn secondary" onClick={() => nav('/users')}>
          ← Back
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card">
          <div className="text-xs text-muted">Last Login</div>
          <div className="text-lg font-semibold text-text">{userData.lastLogin}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Active Sessions</div>
          <div className="text-lg font-semibold text-text">{userData.sessions}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">MFA Status</div>
          <div className="text-lg font-semibold">
            {userData.mfaEnabled ? (
              <span className="text-ok">Enabled</span>
            ) : (
              <span className="text-warn">Disabled</span>
            )}
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Member Since</div>
          <div className="text-lg font-semibold text-text">{userData.createdAt}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-light pb-2 mb-4">
        {(['profile', 'security', 'activity'] as const).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === t ? 'bg-accent text-white' : 'text-muted hover:text-text'
            }`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-text mb-3">Profile Information</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted">Full Name</div>
                <div className="font-medium">{userData.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Email</div>
                <div className="font-medium">{userData.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Phone</div>
                <div className="font-medium">{userData.phone}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Timezone</div>
                <div className="font-medium">{userData.timezone}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-text mb-3">Organization</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted">Organization</div>
                <div className="font-medium">{userData.orgId}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Region</div>
                <div className="font-medium">{userData.region}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Role</div>
                <div className="font-medium">{ROLE_LABELS[userData.role]}</div>
              </div>
            </div>
            {perms.edit && (
              <button className="btn secondary mt-4" onClick={() => alert('Edit role (demo)')}>
                Change Role
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-text mb-3">Security Actions</h3>
            <div className="flex flex-wrap gap-2">
              {perms.edit && (
                <button className="btn secondary" onClick={handleResetPassword} disabled={busy}>
                  Reset Password
                </button>
              )}
              {perms.edit && (
                <button className="btn secondary" onClick={handleForceLogout} disabled={busy}>
                  Force Logout
                </button>
              )}
              {perms.impersonate && userData.id !== currentUser?.id && (
                <button className="btn secondary" onClick={handleImpersonate} disabled={busy}>
                  Impersonate
                </button>
              )}
              {perms.suspend && userData.status === 'Active' && userData.id !== currentUser?.id && (
                <button className="btn danger" onClick={handleSuspend} disabled={busy}>
                  Suspend User
                </button>
              )}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-text mb-3">MFA Configuration</h3>
            <div className="flex items-center justify-between">
              <span className="text-muted">Two-Factor Authentication</span>
              <span className={userData.mfaEnabled ? 'text-ok font-semibold' : 'text-warn font-semibold'}>
                {userData.mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {perms.edit && !userData.mfaEnabled && (
              <button className="btn secondary mt-3" onClick={() => alert('Require MFA (demo)')}>
                Require MFA
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="card">
          <h3 className="font-semibold text-text mb-3">Recent Activity</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Event</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {userData.auditLog.map((log, i) => (
                  <tr key={i}>
                    <td className="text-muted text-sm">{log.when}</td>
                    <td className="font-medium">{log.event}</td>
                    <td className="text-muted text-sm">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

