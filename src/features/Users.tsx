import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { ROLE_LABELS, ALL_ROLES } from '@/constants/roles'
import type { Role } from '@/core/auth/types'
import { RolePill } from '@/ui/components/RolePill'
import { InviteUserModal } from '@/modals/InviteUserModal'
import { useUsers, useUpdateUser, useDeleteUser } from '@/core/api/hooks/useUsers'
import { getErrorMessage } from '@/core/api/errors'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type UserStatus = 'Active' | 'Pending' | 'Suspended' | 'Inactive'
type Region = 'AFRICA' | 'EUROPE' | 'AMERICAS' | 'ASIA' | 'MIDDLE_EAST' | 'ALL'

type UserRow = {
  id: string
  name: string
  email: string
  role: Role
  status: UserStatus
  region: Region
  orgId: string
  lastLogin: string
  createdAt: string
  mfaEnabled: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

// Helper function to map API user to UserRow
function mapUserToRow(user: any): UserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email || '',
    role: user.role as Role,
    status: 'Active' as UserStatus, // API doesn't provide status, defaulting to Active
    region: 'ALL' as Region, // API doesn't provide region, defaulting to ALL
    orgId: user.orgId || 'N/A',
    lastLogin: 'N/A', // API doesn't provide lastLogin
    createdAt: user.createdAt || new Date().toISOString().split('T')[0],
    mfaEnabled: false, // API doesn't provide mfaEnabled
  }
}

const regions: Array<{ id: Region; label: string }> = [
  { id: 'ALL', label: 'All Regions' },
  { id: 'AFRICA', label: 'Africa' },
  { id: 'EUROPE', label: 'Europe' },
  { id: 'AMERICAS', label: 'Americas' },
  { id: 'ASIA', label: 'Asia' },
  { id: 'MIDDLE_EAST', label: 'Middle East' },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Users Page - Admin only
 * 
 * RBAC Controls:
 * - access: ADMIN only
 * - create, edit, delete, impersonate, suspend: ADMIN only
 */
export function Users() {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'users')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const { data: usersData, isLoading, error } = useUsers()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  const [q, setQ] = useState('')
  const [role, setRole] = useState<Role | 'All'>('All')
  const [status, setStatus] = useState<UserStatus | 'All'>('All')
  const [region, setRegion] = useState<Region>('ALL')
  const [openId, setOpenId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Map API users to UserRow format
  const rows = useMemo(() => {
    if (!usersData) return []
    return usersData.map(mapUserToRow)
  }, [usersData])

  const orgs = useMemo(() => {
    const set = new Set(rows.map((r) => r.orgId))
    return ['All', ...Array.from(set)]
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const okQ = !q || (r.id + ' ' + r.name + ' ' + r.email + ' ' + r.orgId).toLowerCase().includes(q.toLowerCase())
      const okRole = role === 'All' || r.role === role
      const okStatus = status === 'All' || r.status === status
      const okRegion = region === 'ALL' || r.region === region
      return okQ && okRole && okStatus && okRegion
    })
  }, [rows, q, role, status, region])

  const stats = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((r) => r.status === 'Active').length,
    pending: filtered.filter((r) => r.status === 'Pending').length,
    suspended: filtered.filter((r) => r.status === 'Suspended').length,
  }), [filtered])

  const openRow = rows.find((r) => r.id === openId) || null

  function statusColor(s: UserStatus) {
    switch (s) {
      case 'Active': return 'approved'
      case 'Pending': return 'pending'
      case 'Suspended': return 'rejected'
      case 'Inactive': return 'sendback'
    }
  }

  return (
    <DashboardLayout pageTitle="Users & Roles">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Users</div>
          <div className="text-xl font-bold text-text">{stats.total}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Active</div>
          <div className="text-xl font-bold text-ok">{stats.active}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Pending</div>
          <div className="text-xl font-bold text-warn">{stats.pending}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Suspended</div>
          <div className="text-xl font-bold text-danger">{stats.suspended}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users"
            className="input col-span-2 xl:col-span-1"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as Role | 'All')} className="select">
            <option value="All">All Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as UserStatus | 'All')} className="select">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value as Region)} className="select">
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      {perms.create && (
        <div className="flex items-center gap-2 mb-4">
          <button className="btn secondary" onClick={() => setInviteModalOpen(true)}>
            + Invite User
          </button>
        </div>
      )}

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={(email, role) => {
          console.log('Inviting user:', { email, role })
          // In a real app, this would call an API
          alert(`Invitation sent to ${email} with role ${ROLE_LABELS[role]} (demo)`)
        }}
      />

      {/* Error Message */}
      {(error || errorMessage) && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">
            {errorMessage || (error ? getErrorMessage(error) : 'An error occurred')}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card mb-4">
          <div className="text-center py-8 text-muted">Loading users...</div>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Org</th>
                <th>Region</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>MFA</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <button className="font-semibold text-text hover:underline text-left" onClick={() => nav(`/users/${r.id}`)}>
                    {r.name}
                  </button>
                  <div className="text-xs text-muted">{r.id}</div>
                </td>
                <td>{r.email}</td>
                <td>
                  <RolePill role={r.role} />
                </td>
                <td>{r.orgId}</td>
                <td>{r.region}</td>
                <td>
                  <span className={`pill ${statusColor(r.status)}`}>{r.status}</span>
                </td>
                <td className="text-sm text-muted">{r.lastLogin}</td>
                <td>
                  {r.mfaEnabled ? (
                    <span className="text-ok">✓</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button className="btn secondary" onClick={() => nav(`/users/${r.id}`)}>
                      View
                    </button>
                    {perms.impersonate && r.id !== user?.id && r.status === 'Active' && (
                      <button className="btn secondary" onClick={() => alert(`Impersonate ${r.name} (demo)`)}>
                        Act As
                      </button>
                    )}
                    {perms.suspend && r.status === 'Active' && r.id !== user?.id && (
                      <button className="btn danger" onClick={() => alert(`Suspend ${r.name} (demo)`)}>
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}

