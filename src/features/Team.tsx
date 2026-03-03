import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import type { Role } from '@/core/auth/types'
import type { StaffPayoutProfile, StationRoleAssignment, TeamMember } from '@/core/api/types'
import { getPermissionsForFeature } from '@/constants/permissions'
import { ROLE_LABELS } from '@/constants/roles'
import { RolePill } from '@/ui/components/RolePill'
import { InviteMemberModal } from '@/ui/components/InviteMemberModal'
import {
  useInviteTeamMember,
  useReplaceTeamAssignments,
  useTeamAssignments,
  useTeamMembers,
  useTeamPayoutProfile,
  useUpdateTeamMember,
  useUpsertTeamPayoutProfile,
} from '@/modules/auth/hooks/useTeamMembers'
import { useStations } from '@/modules/stations/hooks/useStations'
import { KpiCardSkeleton, TableSkeleton } from '@/ui/components/SkeletonCards'

const ASSIGNABLE_ROLES: Role[] = [
  'STATION_ADMIN',
  'MANAGER',
  'ATTENDANT',
  'CASHIER',
  'TECHNICIAN_ORG',
  'STATION_OPERATOR',
]

type EditableStatus = 'Active' | 'Pending' | 'Suspended' | 'Inactive' | 'Invited'

export function Team() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: currentUser } = useAuthStore()
  const perms = getPermissionsForFeature(currentUser?.role, 'team')
  const orgId = currentUser?.activeOrganizationId || currentUser?.organizationId || currentUser?.orgId

  const { data: members, isLoading } = useTeamMembers()
  const { data: stations = [] } = useStations({ orgId })
  const inviteMutation = useInviteTeamMember()
  const updateMutation = useUpdateTeamMember()
  const replaceAssignmentsMutation = useReplaceTeamAssignments()
  const upsertPayoutMutation = useUpsertTeamPayoutProfile()

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All')

  const [profileMember, setProfileMember] = useState<TeamMember | null>(null)
  const [assignmentMember, setAssignmentMember] = useState<TeamMember | null>(null)
  const [payoutMember, setPayoutMember] = useState<TeamMember | null>(null)
  useEffect(() => {
    if (searchParams.get('invite') === '1') {
      setIsInviteModalOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('invite')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])


  const filtered = useMemo(() => {
    if (!members) return []
    return members
      .filter((member) =>
        q
          ? `${member.name} ${member.email || ''} ${member.phone || ''}`
              .toLowerCase()
              .includes(q.toLowerCase())
          : true,
      )
      .filter((member) => (roleFilter === 'All' ? true : member.role === roleFilter))
  }, [members, q, roleFilter])

  const stats = useMemo(
    () => ({
      total: filtered.length,
      active: filtered.filter((member) => member.displayStatus === 'Active').length,
      unassigned: filtered.filter((member) => member.displayStatus === 'Active-Unassigned').length,
      invited: filtered.filter(
        (member) =>
          member.status === 'Invited' ||
          member.status === 'Pending' ||
          member.displayStatus === 'Invited',
      ).length,
    }),
    [filtered],
  )

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Team">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
          <div className="table-wrap">
            <TableSkeleton rows={8} cols={6} />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Team">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Total Members" value={stats.total} tone="default" />
        <KpiCard title="Active" value={stats.active} tone="ok" />
        <KpiCard title="Active-Unassigned" value={stats.unassigned} tone="warn" />
        <KpiCard title="Pending/Invited" value={stats.invited} tone="muted" />
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | 'All')}
            className="w-full sm:w-48 h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer"
          >
            <option value="All">All Roles</option>
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>

        {perms.invite && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full lg:w-auto h-11 px-6 rounded-xl bg-accent text-white text-sm font-black uppercase tracking-wider hover:bg-accent-hover transition-all shadow-lg shadow-accent/20"
          >
            Invite Member
          </button>
        )}
      </div>

      <div className="table-wrap overflow-x-auto rounded-2xl border border-white/5 bg-panel">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-text-secondary uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4 text-center">Role</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Assignments</th>
              <th className="px-6 py-4 text-center">Payout</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                  No team members matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-text">{member.name}</span>
                      <span className="text-xs text-text-secondary">{member.email || member.phone || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <RolePill role={member.role} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={member.displayStatus || member.status || 'Unknown'} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-text">
                      {member.activeAssignments ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border',
                        member.hasPayoutProfile
                          ? 'bg-green-500/10 border-green-500/20 text-green-500'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-500',
                      )}
                    >
                      {member.hasPayoutProfile ? 'Ready' : 'Missing'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setProfileMember(member)}
                        className="px-3 h-9 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-text-secondary hover:text-text"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setAssignmentMember(member)}
                        className="px-3 h-9 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-text-secondary hover:text-text"
                      >
                        Assignments
                      </button>
                      <button
                        onClick={() => setPayoutMember(member)}
                        className="px-3 h-9 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-text-secondary hover:text-text"
                      >
                        Payout
                      </button>
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
          stations={stations.map((station) => ({ id: station.id, name: station.name }))}
          onInvite={async (payload) => {
            await inviteMutation.mutateAsync(payload)
          }}
        />
      )}

      {profileMember && (
        <ProfileModal
          member={profileMember}
          onClose={() => setProfileMember(null)}
          onSave={async (payload) => {
            await updateMutation.mutateAsync({ id: profileMember.id, payload })
            setProfileMember(null)
          }}
        />
      )}

      {assignmentMember && (
        <AssignmentModal
          member={assignmentMember}
          stations={stations.map((station) => ({ id: station.id, name: station.name }))}
          onClose={() => setAssignmentMember(null)}
          onSave={async (assignments) => {
            await replaceAssignmentsMutation.mutateAsync({
              userId: assignmentMember.id,
              assignments,
            })
            setAssignmentMember(null)
          }}
        />
      )}

      {payoutMember && (
        <PayoutModal
          member={payoutMember}
          onClose={() => setPayoutMember(null)}
          onSave={async (payload) => {
            await upsertPayoutMutation.mutateAsync({
              userId: payoutMember.id,
              payload,
            })
            setPayoutMember(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}

function KpiCard({ title, value, tone }: { title: string; value: number; tone: 'default' | 'ok' | 'warn' | 'muted' }) {
  const toneClass =
    tone === 'ok'
      ? 'text-green-500'
      : tone === 'warn'
        ? 'text-amber-500'
        : tone === 'muted'
          ? 'text-text-secondary'
          : 'text-text'
  return (
    <div className="card p-5 border-white/5 shadow-xl bg-white/[0.02]">
      <p className="text-[10px] font-black uppercase tracking-[2px] text-text-secondary mb-1">{title}</p>
      <p className={clsx('text-3xl font-black', toneClass)}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase()
  const className =
    lower === 'active'
      ? 'bg-green-500/10 border-green-500/20 text-green-500'
      : lower === 'active-unassigned'
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
        : 'bg-warn/10 border-warn/20 text-warn'

  return (
    <span
      className={clsx(
        'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all',
        className,
      )}
    >
      {status}
    </span>
  )
}

function ProfileModal({
  member,
  onClose,
  onSave,
}: {
  member: TeamMember
  onClose: () => void
  onSave: (payload: { name: string; phone?: string; status?: EditableStatus; role?: Role }) => Promise<void>
}) {
  const [name, setName] = useState(member.name || '')
  const [phone, setPhone] = useState(member.phone || '')
  const [status, setStatus] = useState<EditableStatus>((member.status || 'Active') as EditableStatus)
  const [role, setRole] = useState<Role>(member.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-bg-secondary p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text">Edit Team Member</h3>
          <button onClick={onClose} className="text-text-secondary">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
            placeholder="Full name"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
            placeholder="Phone number"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EditableStatus)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
          >
            <option value="Active">Active</option>
            <option value="Invited">Invited</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button className="h-10 px-4 rounded-lg border border-white/10" onClick={onClose}>
            Cancel
          </button>
          <button
            className="h-10 px-4 rounded-lg bg-accent text-white font-bold disabled:opacity-60"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              setError(null)
              try {
                await onSave({
                  name: name.trim(),
                  phone: phone.trim() || undefined,
                  role,
                  status,
                })
              } catch (err: any) {
                setError(err?.message || 'Failed to update member')
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignmentModal({
  member,
  stations,
  onClose,
  onSave,
}: {
  member: TeamMember
  stations: Array<{ id: string; name: string }>
  onClose: () => void
  onSave: (assignments: StationRoleAssignment[]) => Promise<void>
}) {
  const { data, isLoading } = useTeamAssignments(member.id, true)
  const [rows, setRows] = useState<StationRoleAssignment[]>([])
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialized && data?.assignments) {
      setRows(
        data.assignments.length > 0
          ? data.assignments
          : [
              {
                stationId: stations[0]?.id || '',
                role: 'ATTENDANT',
                isPrimary: true,
                isActive: true,
                attendantMode: 'FIXED',
                shiftStart: '00:00',
                shiftEnd: '23:59',
                timezone: 'Africa/Kampala',
              },
            ],
      )
      setInitialized(true)
    }
  }, [data?.assignments, initialized, stations])

  if (isLoading && !initialized) {
    return (
      <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-bg-secondary p-6">
          <TableSkeleton rows={4} cols={4} />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-bg-secondary p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text">Manage Assignments: {member.name}</h3>
          <button onClick={onClose} className="text-text-secondary">Close</button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {rows.map((row, index) => {
            const isAttendant = row.role === 'ATTENDANT'
            return (
              <div key={`assignment-${row.id || index}`} className="rounded-xl border border-white/10 p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={row.stationId}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, stationId: e.target.value } : item)),
                      )
                    }
                    className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                  >
                    <option value="">Select station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={row.role}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, role: e.target.value as Role } : item,
                        ),
                      )
                    }
                    className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>

                  <label className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 inline-flex items-center gap-2 text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={Boolean(row.isPrimary)}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((item, i) => ({ ...item, isPrimary: i === index ? e.target.checked : false })),
                        )
                      }
                    />
                    Primary
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="h-10 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 inline-flex items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={row.isActive !== false}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, isActive: e.target.checked } : item)),
                          )
                        }
                      />
                      Active
                    </label>
                    {rows.length > 1 && (
                      <button
                        className="h-10 px-3 rounded-lg border border-red-500/20 text-red-400 text-xs font-bold"
                        onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {isAttendant && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                      value={row.attendantMode || 'FIXED'}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, attendantMode: e.target.value as 'FIXED' | 'MOBILE' }
                              : item,
                          ),
                        )
                      }
                      className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                    >
                      <option value="FIXED">Fixed</option>
                      <option value="MOBILE">Mobile</option>
                    </select>
                    <input
                      type="time"
                      value={row.shiftStart || '00:00'}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, shiftStart: e.target.value } : item)),
                        )
                      }
                      className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                    />
                    <input
                      type="time"
                      value={row.shiftEnd || '23:59'}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, shiftEnd: e.target.value } : item)),
                        )
                      }
                      className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                    />
                    <input
                      type="text"
                      value={row.timezone || 'Africa/Kampala'}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, timezone: e.target.value } : item)),
                        )
                      }
                      className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          className="h-10 px-4 rounded-lg border border-white/10 text-sm font-bold text-text-secondary"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                stationId: stations[0]?.id || '',
                role: 'ATTENDANT',
                isPrimary: prev.length === 0,
                isActive: true,
                attendantMode: 'FIXED',
                shiftStart: '00:00',
                shiftEnd: '23:59',
                timezone: 'Africa/Kampala',
              },
            ])
          }
        >
          Add Assignment
        </button>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button className="h-10 px-4 rounded-lg border border-white/10" onClick={onClose}>
            Cancel
          </button>
          <button
            className="h-10 px-4 rounded-lg bg-accent text-white font-bold disabled:opacity-60"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              setError(null)
              try {
                await onSave(rows)
              } catch (err: any) {
                setError(err?.message || 'Failed to save assignments')
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PayoutModal({
  member,
  onClose,
  onSave,
}: {
  member: TeamMember
  onClose: () => void
  onSave: (payload: StaffPayoutProfile) => Promise<void>
}) {
  const { data, isLoading } = useTeamPayoutProfile(member.id, true)
  const [method, setMethod] = useState<StaffPayoutProfile['method']>('MOBILE_MONEY')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [providerName, setProviderName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [currency, setCurrency] = useState('UGX')
  const [isActive, setIsActive] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialized && data) {
      setMethod(data.method || 'MOBILE_MONEY')
      setBeneficiaryName(data.beneficiaryName || '')
      setProviderName(data.providerName || '')
      setBankName(data.bankName || '')
      setAccountNumber(data.accountNumber || '')
      setPhoneNumber(data.phoneNumber || '')
      setCurrency(data.currency || 'UGX')
      setIsActive(data.isActive ?? true)
      setInitialized(true)
    }
    if (!initialized && data === null) {
      setInitialized(true)
    }
  }, [data, initialized])

  if (isLoading && !initialized) {
    return (
      <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-bg-secondary p-6">
          <TableSkeleton rows={4} cols={2} />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-bg-secondary p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text">Payout Profile: {member.name}</h3>
          <button onClick={onClose} className="text-text-secondary">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as StaffPayoutProfile['method'])}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
          >
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH_PICKUP">Cash Pickup</option>
          </select>
          <input
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
            placeholder="Beneficiary name"
          />

          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
            placeholder="Currency"
          />
          <label className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 inline-flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Profile Active
          </label>

          {method === 'MOBILE_MONEY' && (
            <>
              <input
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                placeholder="Provider name"
              />
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                placeholder="Phone number"
              />
            </>
          )}

          {method === 'BANK_TRANSFER' && (
            <>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                placeholder="Bank name"
              />
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                placeholder="Account number"
              />
            </>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button className="h-10 px-4 rounded-lg border border-white/10" onClick={onClose}>
            Cancel
          </button>
          <button
            className="h-10 px-4 rounded-lg bg-accent text-white font-bold disabled:opacity-60"
            disabled={saving}
            onClick={async () => {
              if (!beneficiaryName.trim()) {
                setError('Beneficiary name is required')
                return
              }
              if (method === 'MOBILE_MONEY' && !phoneNumber.trim()) {
                setError('Phone number is required for mobile money')
                return
              }
              if (method === 'BANK_TRANSFER' && (!bankName.trim() || !accountNumber.trim())) {
                setError('Bank name and account number are required for bank transfer')
                return
              }

              setSaving(true)
              setError(null)
              try {
                await onSave({
                  method,
                  beneficiaryName: beneficiaryName.trim(),
                  providerName: providerName.trim() || undefined,
                  bankName: bankName.trim() || undefined,
                  accountNumber: accountNumber.trim() || undefined,
                  phoneNumber: phoneNumber.trim() || undefined,
                  currency: currency.trim() || 'UGX',
                  isActive,
                })
              } catch (err: any) {
                setError(err?.message || 'Failed to save payout profile')
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Payout Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}




