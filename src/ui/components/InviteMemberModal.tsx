import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { OwnerCapability, Role } from '@/core/auth/types'
import type { TeamInviteRequest } from '@/core/api/types'
import { ALL_ROLES, CAPABILITY_LABELS, ROLE_LABELS } from '@/constants/roles'
import { Card } from './Card'
import {
  buildInviteRoleOptions,
  type CustomRoleOption,
  isStationScopedRole,
} from '@/modules/auth/utils/teamRoles'

type StationOption = {
  id: string
  name: string
}

type AssignmentFormRow = {
  stationId: string
  isPrimary: boolean
  isActive: boolean
  attendantMode?: 'FIXED' | 'MOBILE'
  shiftStart?: string
  shiftEnd?: string
  timezone?: string
}

interface InviteMemberModalProps {
  onClose: () => void
  onInvite: (payload: TeamInviteRequest) => Promise<void>
  stations: StationOption[]
  customRoles: CustomRoleOption[]
  defaultRegion?: string
  defaultZoneId?: string
}

function createDefaultRow(stationId = ''): AssignmentFormRow {
  return {
    stationId,
    isPrimary: true,
    isActive: true,
    attendantMode: 'FIXED',
    shiftStart: '00:00',
    shiftEnd: '23:59',
    timezone: 'Africa/Kampala',
  }
}

export function InviteMemberModal({
  onClose,
  onInvite,
  stations,
  customRoles,
  defaultRegion,
  defaultZoneId,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [roleValue, setRoleValue] = useState<string>('STATION_ADMIN')
  const [ownerCapability, setOwnerCapability] = useState<OwnerCapability>('BOTH')
  const [region, setRegion] = useState(defaultRegion || '')
  const [zoneId, setZoneId] = useState(defaultZoneId || '')
  const [assignments, setAssignments] = useState<AssignmentFormRow[]>([
    createDefaultRow(stations[0]?.id || ''),
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roleOptions = useMemo(() => buildInviteRoleOptions(customRoles), [customRoles])
  const selectedRole =
    roleOptions.find((option) => option.value === roleValue) ?? roleOptions[0]
  const selectedBaseRole = selectedRole?.baseRole || 'STATION_ADMIN'
  const isStationRole = isStationScopedRole(selectedBaseRole)
  const isAttendantRole = selectedBaseRole === 'ATTENDANT'
  const showCapability =
    selectedBaseRole === 'STATION_OWNER' || selectedBaseRole === 'STATION_OPERATOR'

  const customRolesByBaseRole = useMemo(() => {
    return ALL_ROLES.reduce<Record<Role, CustomRoleOption[]>>((acc, role) => {
      acc[role] = customRoles.filter((item) => item.baseRole === role)
      return acc
    }, {} as Record<Role, CustomRoleOption[]>)
  }, [customRoles])

  const setRow = (index: number, updater: (row: AssignmentFormRow) => AssignmentFormRow) => {
    setAssignments((prev) => prev.map((row, i) => (i === index ? updater(row) : row)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedRegion = region.trim()
    const trimmedZoneId = zoneId.trim()

    if (!trimmedEmail) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    let normalizedAssignments: TeamInviteRequest['initialAssignments']
    if (isStationRole) {
      if (assignments.length === 0) {
        setError('At least one station assignment is required')
        return
      }

      const missingStation = assignments.find((row) => !row.stationId)
      if (missingStation) {
        setError('Each assignment row must include a station')
        return
      }

      const stationIds = assignments.map((row) => row.stationId)
      if (new Set(stationIds).size !== stationIds.length) {
        setError('Each station can only appear once in initial assignments')
        return
      }

      normalizedAssignments = assignments.map((row, index) => ({
        stationId: row.stationId,
        role: selectedBaseRole,
        isPrimary: row.isPrimary || index === 0,
        isActive: row.isActive,
        attendantMode: isAttendantRole ? row.attendantMode || 'FIXED' : undefined,
        shiftStart: isAttendantRole ? row.shiftStart || '00:00' : undefined,
        shiftEnd: isAttendantRole ? row.shiftEnd || '23:59' : undefined,
        timezone: isAttendantRole ? row.timezone || 'Africa/Kampala' : undefined,
      }))
    } else {
      if (!trimmedRegion && !trimmedZoneId) {
        setError('Region or Zone ID is required for non-station invites')
        return
      }
    }

    const payload: TeamInviteRequest = {
      email: trimmedEmail,
      role: selectedBaseRole,
      customRoleId: selectedRole?.customRoleId,
      customRoleName: selectedRole?.customRoleName,
      ownerCapability: showCapability ? ownerCapability : undefined,
      region: !isStationRole ? trimmedRegion || undefined : undefined,
      zoneId: !isStationRole ? trimmedZoneId || undefined : undefined,
      initialAssignments: normalizedAssignments,
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await onInvite(payload)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to send invitation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-4xl p-6 shadow-2xl border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text">Invite Team Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-text-secondary transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-text-secondary ml-1">
                Email Address
              </label>
              <input
                autoFocus
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-text-secondary ml-1">
                Invite Role
              </label>
              <select
                value={roleValue}
                onChange={(e) => setRoleValue(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              >
                <optgroup label="Standard Roles">
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </optgroup>
                {ALL_ROLES.map((role) => {
                  const groupedRoles = customRolesByBaseRole[role]
                  if (!groupedRoles?.length) return null
                  return (
                    <optgroup key={`custom-${role}`} label={`Custom - ${ROLE_LABELS[role]}`}>
                      {groupedRoles.map((customRole) => (
                        <option key={customRole.id} value={`custom:${customRole.id}`}>
                          {customRole.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            </div>
          </div>

          {showCapability && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-text-secondary ml-1">
                  Owner Capability
                </label>
                <select
                  value={ownerCapability}
                  onChange={(e) => setOwnerCapability(e.target.value as OwnerCapability)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                >
                  {(['CHARGE', 'SWAP', 'BOTH'] as OwnerCapability[]).map((capability) => (
                    <option key={capability} value={capability}>
                      {CAPABILITY_LABELS[capability]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!isStationRole && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-text-secondary ml-1">
                  Region
                </label>
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. AFRICA"
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-text-secondary ml-1">
                  Zone ID
                </label>
                <input
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  placeholder="Optional when region is known"
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
            </div>
          )}

          {isStationRole && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-wider text-text-secondary">
                  Initial Station Assignments
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setAssignments((prev) => [...prev, createDefaultRow(stations[0]?.id || '')])
                  }
                  className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-text-secondary hover:text-text"
                >
                  Add Row
                </button>
              </div>

              {assignments.map((row, index) => (
                <div
                  key={`assignment-row-${index}`}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                      value={row.stationId}
                      onChange={(e) =>
                        setRow(index, (current) => ({ ...current, stationId: e.target.value }))
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

                    <div className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text inline-flex items-center">
                      {selectedRole?.customRoleName || ROLE_LABELS[selectedBaseRole]}
                    </div>

                    <label className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 inline-flex items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={row.isPrimary}
                        onChange={(e) =>
                          setAssignments((prev) =>
                            prev.map((item, i) => ({
                              ...item,
                              isPrimary: i === index ? e.target.checked : false,
                            })),
                          )
                        }
                      />
                      Primary
                    </label>

                    <div className="flex items-center justify-between gap-2">
                      <label className="h-10 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 inline-flex items-center gap-2 text-xs text-text-secondary">
                        <input
                          type="checkbox"
                          checked={row.isActive}
                          onChange={(e) =>
                            setRow(index, (current) => ({
                              ...current,
                              isActive: e.target.checked,
                            }))
                          }
                        />
                        Active
                      </label>
                      {assignments.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setAssignments((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="h-10 px-3 rounded-lg border border-red-500/20 text-red-400 text-xs font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {isAttendantRole && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select
                        value={row.attendantMode || 'FIXED'}
                        onChange={(e) =>
                          setRow(index, (current) => ({
                            ...current,
                            attendantMode: e.target.value as 'FIXED' | 'MOBILE',
                          }))
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
                          setRow(index, (current) => ({ ...current, shiftStart: e.target.value }))
                        }
                        className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                      />

                      <input
                        type="time"
                        value={row.shiftEnd || '23:59'}
                        onChange={(e) =>
                          setRow(index, (current) => ({ ...current, shiftEnd: e.target.value }))
                        }
                        className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                      />

                      <input
                        type="text"
                        value={row.timezone || 'Africa/Kampala'}
                        onChange={(e) =>
                          setRow(index, (current) => ({ ...current, timezone: e.target.value }))
                        }
                        className="h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-text"
                        placeholder="Africa/Kampala"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className={clsx('p-3 rounded-lg border text-xs font-medium', 'bg-red-500/10 border-red-500/20 text-red-500')}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl font-bold text-sm text-text-secondary hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] h-11 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-50 transition-all shadow-lg shadow-accent/20"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
