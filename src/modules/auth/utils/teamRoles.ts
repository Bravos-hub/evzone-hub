import type { Role } from '@/core/auth/types'
import { ALL_ROLES, ROLE_LABELS } from '@/constants/roles'

export type CustomRoleOption = {
  id: string
  name: string
  baseRole: Role
}

export type InviteRoleOption = {
  value: string
  label: string
  baseRole: Role
  customRoleId?: string
  customRoleName?: string
}

export const TEAM_MANAGEABLE_ROLES: Role[] = ALL_ROLES

export const STATION_SCOPED_ROLES: Role[] = [
  'STATION_OPERATOR',
  'STATION_ADMIN',
  'MANAGER',
  'ATTENDANT',
  'CASHIER',
]

const STATION_SCOPED_ROLE_SET = new Set<Role>(STATION_SCOPED_ROLES)

export function isStationScopedRole(role?: Role | string | null): role is Role {
  return Boolean(role && STATION_SCOPED_ROLE_SET.has(role as Role))
}

export function buildInviteRoleOptions(customRoles: CustomRoleOption[]): InviteRoleOption[] {
  const standardOptions = TEAM_MANAGEABLE_ROLES.map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
    baseRole: role,
  }))

  const customOptions = customRoles.map((role) => ({
    value: `custom:${role.id}`,
    label: role.name,
    baseRole: role.baseRole,
    customRoleId: role.id,
    customRoleName: role.name,
  }))

  return [...standardOptions, ...customOptions]
}

export function getRoleDisplayLabel(role: string, customRoleName?: string | null): string {
  if (customRoleName) return customRoleName
  return ROLE_LABELS[role as Role] || role
}
