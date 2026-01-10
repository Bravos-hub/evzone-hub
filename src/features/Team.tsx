import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/core/auth/types'
import { RolePill } from '@/ui/components/RolePill'
import { useUsers, useUpdateUser, useDeleteUser, useInviteUser } from '@/core/api/hooks/useUsers'
import { InviteMemberModal } from '@/ui/components/InviteMemberModal'
import { EVChargingAnimation } from '@/ui/components/EVChargingAnimation'
import clsx from 'clsx'

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function Team() {
  const { user: currentUser } = useAuthStore()
  const perms = getPermissionsForFeature(currentUser?.role, 'team')

  const { data: users, isLoading } = useUsers()
  const inviteMutation = useInviteUser()
  const deleteMutation = useDeleteUser()
  const updateMutation = useUpdateUser()

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All')

  const filtered = useMemo(() => {
    if (!users) return []
    let result = users

    // If STATION_OPERATOR, filter to only show manageable roles
    if (currentUser?.role === 'STATION_OPERATOR') {
      const manageableRoles: Role[] = ['MANAGER', 'ATTENDANT', 'CASHIER', 'TECHNICIAN_ORG', 'STATION_ADMIN']
      result = result.filter(u => manageableRoles.includes(u.role))
    }

    return result
      .filter((r) => (q ? (r.name + ' ' + r.email).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (roleFilter === 'All' ? true : r.role === roleFilter))
  }, [users, q, roleFilter, currentUser])

  const stats = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((r) => r.status === 'Active' || !r.status).length,
    invited: filtered.filter((r) => r.status === 'Invited' || r.status === 'Pending').length,
  }), [filtered])

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Team">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-24 h-24">
            <EVChargingAnimation />
          </div>
          <p className="text-text-secondary animate-pulse font-medium">Loading team directory...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Team">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 border-white/5 shadow-xl bg-white/[0.02]">
          <p className="text-[10px] font-black uppercase tracking-[2px] text-text-secondary mb-1">Total Members</p>
          <p className="text-3xl font-black text-text">{stats.total}</p>
        </div>
        <div className="card p-5 border-white/5 shadow-xl bg-white/[0.02]">
          <p className="text-[10px] font-black uppercase tracking-[2px] text-text-secondary mb-1">Active</p>
          <p className="text-3xl font-black text-ok">{stats.active}</p>
        </div>
        <div className="card p-5 border-white/5 shadow-xl bg-white/[0.02]">
          <p className="text-[10px] font-black uppercase tracking-[2px] text-text-secondary mb-1">Pending Invitations</p>
          <p className="text-3xl font-black text-warn">{stats.invited}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-accent transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | 'All')}
            className="w-full sm:w-48 h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="MANAGER">{ROLE_LABELS.MANAGER}</option>
            <option value="ATTENDANT">{ROLE_LABELS.ATTENDANT}</option>
            <option value="CASHIER">{ROLE_LABELS.CASHIER}</option>
            <option value="TECHNICIAN_ORG">{ROLE_LABELS.TECHNICIAN_ORG}</option>
            <option value="STATION_ADMIN">{ROLE_LABELS.STATION_ADMIN}</option>
          </select>
        </div>

        {perms.invite && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full lg:w-auto h-11 px-6 rounded-xl bg-accent text-white text-sm font-black uppercase tracking-wider hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      <div className="table-wrap overflow-x-auto rounded-2xl border border-white/5 bg-panel">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-text-secondary uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">Name & Contact</th>
              <th className="px-6 py-4 text-center">Role</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-text-secondary">
                  No team members matching your filters
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-text group-hover:text-accent transition-colors">{r.name}</span>
                      <span className="text-xs text-text-secondary">{r.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <RolePill role={r.role} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={clsx(
                      'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all',
                      (r.status === 'Active' || !r.status) ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-warn/10 border-warn/20 text-warn'
                    )}>
                      {r.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {perms.changeRole && (
                        <button
                          onClick={() => alert('Edit permissions feature coming soon')}
                          className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-accent text-text-secondary hover:text-accent transition-all"
                          title="Edit Permissions"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                      )}
                      {perms.remove && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${r.name}?`)) {
                              deleteMutation.mutate(r.id)
                            }
                          }}
                          className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-red-500 text-text-secondary hover:text-red-500 transition-all"
                          title="Remove Member"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
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

      {isInviteModalOpen && (
        <InviteMemberModal
          onClose={() => setIsInviteModalOpen(false)}
          onInvite={async (data) => {
            await inviteMutation.mutateAsync(data)
          }}
        />
      )}
    </DashboardLayout>
  )
}

