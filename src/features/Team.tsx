import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/core/auth/types'
import { RolePill } from '@/ui/components/RolePill'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type TeamMember = {
  id: string
  name: string
  email: string
  role: Role
  status: 'Active' | 'Invited' | 'Inactive'
  lastActive: string
  stationsAssigned: number
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockTeam: TeamMember[] = [
  {
    id: 'TM-001',
    name: 'Grace Manager',
    email: 'grace@voltmobility.com',
    role: 'MANAGER',
    status: 'Active',
    lastActive: '10m ago',
    stationsAssigned: 3,
  },
  {
    id: 'TM-002',
    name: 'Allan Technician',
    email: 'allan@voltmobility.com',
    role: 'TECHNICIAN_ORG',
    status: 'Active',
    lastActive: '2h ago',
    stationsAssigned: 5,
  },
  {
    id: 'TM-003',
    name: 'Mary Attendant',
    email: 'mary@voltmobility.com',
    role: 'ATTENDANT',
    status: 'Active',
    lastActive: '30m ago',
    stationsAssigned: 1,
  },
  {
    id: 'TM-004',
    name: 'New Hire',
    email: 'newhire@voltmobility.com',
    role: 'ATTENDANT',
    status: 'Invited',
    lastActive: 'Never',
    stationsAssigned: 0,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Team Page - For organization management
 * 
 * RBAC Controls:
 * - viewAll: ADMIN, OPERATOR see all teams
 * - invite: ADMIN, OPERATOR, OWNER, STATION_ADMIN can invite
 * - remove: ADMIN, OPERATOR, OWNER can remove
 * - changeRole: ADMIN, OPERATOR can change roles
 */
export function Team() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'team')

  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Invited' | 'Inactive'>('All')

  const filtered = useMemo(() => {
    return mockTeam
      .filter((r) => (q ? (r.name + ' ' + r.email).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (roleFilter === 'All' ? true : r.role === roleFilter))
      .filter((r) => (statusFilter === 'All' ? true : r.status === statusFilter))
  }, [q, roleFilter, statusFilter])

  const stats = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((r) => r.status === 'Active').length,
    invited: filtered.filter((r) => r.status === 'Invited').length,
  }), [filtered])

  function statusColor(s: string) {
    switch (s) {
      case 'Active': return 'approved'
      case 'Invited': return 'pending'
      case 'Inactive': return 'rejected'
      default: return 'sendback'
    }
  }

  return (
    <DashboardLayout pageTitle="Team">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 xl:grid-cols-3">
        <div className="card">
          <div className="text-xs text-muted">Team Members</div>
          <div className="text-xl font-bold text-text">{stats.total}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Active</div>
          <div className="text-xl font-bold text-ok">{stats.active}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Pending Invites</div>
          <div className="text-xl font-bold text-warn">{stats.invited}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search team members"
            className="input col-span-2 xl:col-span-1"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | 'All')} className="select">
            <option value="All">All Roles</option>
            <option value="MANAGER">{ROLE_LABELS.MANAGER}</option>
            <option value="ATTENDANT">{ROLE_LABELS.ATTENDANT}</option>
            <option value="TECHNICIAN_ORG">{ROLE_LABELS.TECHNICIAN_ORG}</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="select">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Invited">Invited</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      {perms.invite && (
        <div className="flex items-center gap-2 mb-4">
          <button className="btn secondary" onClick={() => alert('Invite team member (demo)')}>
            + Invite Member
          </button>
        </div>
      )}

      {/* Team Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="w-32">Name</th>
              <th className="w-48">Email</th>
              <th className="w-24">Role</th>
              <th className="w-24">Status</th>
              <th className="w-20">Stations</th>
              <th className="w-24">Last Active</th>
              <th className="!text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold truncate max-w-[128px]" title={r.name}>{r.name}</td>
                <td className="text-muted truncate max-w-[192px]" title={r.email}>{r.email}</td>
                <td className="whitespace-nowrap">
                  <RolePill role={r.role} />
                </td>
                <td className="whitespace-nowrap">
                  <span className={`pill ${statusColor(r.status)}`}>{r.status}</span>
                </td>
                <td className="text-center">{r.stationsAssigned}</td>
                <td className="text-sm text-muted whitespace-nowrap">{r.lastActive}</td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button className="btn secondary" onClick={() => alert(`View ${r.name} (demo)`)}>
                      View
                    </button>
                    {perms.changeRole && (
                      <button className="btn secondary" onClick={() => alert(`Change role (demo)`)}>
                        Edit
                      </button>
                    )}
                    {perms.remove && r.status !== 'Inactive' && (
                      <button className="btn danger" onClick={() => alert(`Remove ${r.name} (demo)`)}>
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

