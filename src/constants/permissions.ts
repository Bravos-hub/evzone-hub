import type { Role } from '@/core/auth/types'
import { ROLE_GROUPS } from './roles'

/**
 * Central permission definitions for all features
 * Each feature defines what actions each role can perform
 */

export type Permission = Role[] | 'ALL'

export type FeaturePermissions = {
  /** Who can access this feature at all */
  access: Permission
  /** Who can view all data (vs only their own) */
  viewAll?: Permission
  /** Who can create new items */
  create?: Permission
  /** Who can edit items */
  edit?: Permission
  /** Who can delete items */
  delete?: Permission
  /** Who can export data */
  export?: Permission
  /** Custom permissions specific to the feature */
  [key: string]: Permission | undefined
}

/** Permission definitions for each feature */
export const PERMISSIONS: Record<string, FeaturePermissions> = {
  // ═══════════════════════════════════════════════════════════════════════
  // CORE FEATURES (Multiple roles use these)
  // ═══════════════════════════════════════════════════════════════════════

  dashboard: {
    access: 'ALL',
  },

  stations: {
    access: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN', 'MANAGER'],
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    create: ROLE_GROUPS.PLATFORM_OPS,
    edit: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
    delete: ROLE_GROUPS.PLATFORM_ADMINS,
    remoteCommands: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
  },

  sessions: {
    access: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_STAFF],
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    export: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER'],
    refund: ROLE_GROUPS.PLATFORM_OPS,
    stopSession: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN', 'ATTENDANT'],
  },

  incidents: {
    access: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_MANAGERS, ...ROLE_GROUPS.TECHNICIANS],
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    create: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_STAFF],
    assign: ROLE_GROUPS.PLATFORM_OPS,
    resolve: [...ROLE_GROUPS.PLATFORM_OPS, 'MANAGER', ...ROLE_GROUPS.TECHNICIANS],
    escalate: ROLE_GROUPS.PLATFORM_OPS,
  },

  dispatches: {
    access: [...ROLE_GROUPS.PLATFORM_OPS, 'MANAGER', ...ROLE_GROUPS.TECHNICIANS],
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    create: ROLE_GROUPS.PLATFORM_OPS,
    assign: ROLE_GROUPS.PLATFORM_OPS,
    accept: ROLE_GROUPS.TECHNICIANS,
    complete: ROLE_GROUPS.TECHNICIANS,
  },

  billing: {
    access: ROLE_GROUPS.FINANCIAL_VIEWERS,
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    export: ROLE_GROUPS.PLATFORM_ADMINS,
    refund: ROLE_GROUPS.PLATFORM_OPS,
    adjustments: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  reports: {
    access: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'SITE_OWNER'],
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    export: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER'],
    schedule: ROLE_GROUPS.PLATFORM_OPS,
  },

  team: {
    access: ['STATION_ADMIN'],
    viewAll: ['STATION_ADMIN'],
    invite: ['STATION_ADMIN'],
    remove: ['STATION_ADMIN'],
    changeRole: ['STATION_ADMIN'],
  },

  notifications: {
    access: 'ALL',
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    broadcast: ROLE_GROUPS.PLATFORM_OPS,
    configure: ROLE_GROUPS.PLATFORM_OPS,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN-HEAVY FEATURES
  // ═══════════════════════════════════════════════════════════════════════

  users: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    viewAll: ROLE_GROUPS.PLATFORM_ADMINS,
    create: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
    delete: ROLE_GROUPS.PLATFORM_ADMINS,
    impersonate: ROLE_GROUPS.PLATFORM_ADMINS,
    suspend: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  approvals: {
    access: ROLE_GROUPS.PLATFORM_OPS,
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    approve: ROLE_GROUPS.PLATFORM_OPS,
    reject: ROLE_GROUPS.PLATFORM_OPS,
  },

  auditLogs: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    viewAll: ROLE_GROUPS.PLATFORM_ADMINS,
    export: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  systemHealth: {
    access: ROLE_GROUPS.PLATFORM_OPS,
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    restart: ROLE_GROUPS.PLATFORM_ADMINS,
    configure: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  globalConfig: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  integrations: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    create: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
    delete: ROLE_GROUPS.PLATFORM_ADMINS,
    rotateKeys: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  rolesMatrix: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
    export: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  organizations: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    viewAll: ROLE_GROUPS.PLATFORM_ADMINS,
    create: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
    delete: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  protocolsConsole: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    ocpp: ROLE_GROUPS.PLATFORM_ADMINS,
    ocpi: ROLE_GROUPS.PLATFORM_ADMINS,
    mqtt: ROLE_GROUPS.PLATFORM_ADMINS,
    openadr: ROLE_GROUPS.PLATFORM_ADMINS,
    roaming: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  settlement: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    export: ROLE_GROUPS.PLATFORM_ADMINS,
    resolve: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  plans: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    create: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
    delete: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  featureFlags: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  webhooksLog: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    replay: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  kycCompliance: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    approve: ROLE_GROUPS.PLATFORM_ADMINS,
    reject: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  disputes: {
    access: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER'],
    viewAll: ROLE_GROUPS.PLATFORM_OPS,
    resolve: ROLE_GROUPS.PLATFORM_OPS,
    escalate: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  broadcasts: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    create: ROLE_GROUPS.PLATFORM_ADMINS,
    send: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  protocols: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    viewAll: ROLE_GROUPS.PLATFORM_ADMINS,
    configure: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  webhooks: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    create: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
    delete: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  supportDesk: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    respond: ROLE_GROUPS.PLATFORM_ADMINS,
    escalate: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  privacyRequests: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    process: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  crm: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  statusPage: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    update: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // OWNER-SPECIFIC FEATURES
  // ═══════════════════════════════════════════════════════════════════════

  tariffs: {
    access: ['OWNER', 'STATION_ADMIN'],
    edit: ['OWNER'],
  },

  chargePoints: {
    access: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN', 'MANAGER'],
    create: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
    edit: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
    remoteCommands: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
  },

  swapStations: {
    access: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN', 'MANAGER'],
    create: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
    edit: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
  },

  smartCharging: {
    access: ['OWNER', 'STATION_ADMIN'],
    configure: ['OWNER'],
  },

  earnings: {
    access: ['OWNER', 'SITE_OWNER'],
    export: ['OWNER', 'SITE_OWNER'],
  },

  bookings: {
    access: ['OWNER', 'STATION_ADMIN', 'MANAGER', 'ATTENDANT'],
    create: ['OWNER', 'STATION_ADMIN', 'MANAGER', 'ATTENDANT'],
    cancel: ['OWNER', 'STATION_ADMIN', 'MANAGER'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SITE OWNER FEATURES
  // ═══════════════════════════════════════════════════════════════════════

  sites: {
    access: ['SITE_OWNER'],
    viewAll: ['SITE_OWNER'],
    create: ['SITE_OWNER'],
    edit: ['SITE_OWNER'],
  },

  parking: {
    access: ['SITE_OWNER', ...ROLE_GROUPS.PLATFORM_OPS],
    view: ['SITE_OWNER', ...ROLE_GROUPS.PLATFORM_OPS],
    edit: ['SITE_OWNER', ...ROLE_GROUPS.PLATFORM_OPS],
  },

  tenants: {
    access: ['SITE_OWNER', ...ROLE_GROUPS.PLATFORM_OPS],
    view: ['SITE_OWNER', ...ROLE_GROUPS.PLATFORM_OPS],
    edit: ['SITE_OWNER', ...ROLE_GROUPS.PLATFORM_OPS],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TECHNICIAN FEATURES
  // ═══════════════════════════════════════════════════════════════════════

  jobs: {
    access: ROLE_GROUPS.TECHNICIANS,
    accept: ROLE_GROUPS.TECHNICIANS,
    complete: ROLE_GROUPS.TECHNICIANS,
    viewAvailable: ['TECHNICIAN_PUBLIC'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // NEW PORTED FEATURES
  // ═══════════════════════════════════════════════════════════════════════

  content: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    view: ROLE_GROUPS.PLATFORM_ADMINS,
    edit: ROLE_GROUPS.PLATFORM_ADMINS,
    publish: ROLE_GROUPS.PLATFORM_ADMINS,
    delete: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  openadr: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    view: ROLE_GROUPS.PLATFORM_ADMINS,
    manage: ROLE_GROUPS.PLATFORM_ADMINS,
    createEvent: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  roaming: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    view: ROLE_GROUPS.PLATFORM_ADMINS,
    manage: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  regulatory: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    view: ROLE_GROUPS.PLATFORM_ADMINS,
    manage: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  utility: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    view: ROLE_GROUPS.PLATFORM_ADMINS,
    manage: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  partners: {
    access: ROLE_GROUPS.PLATFORM_ADMINS,
    view: ROLE_GROUPS.PLATFORM_ADMINS,
    manage: ROLE_GROUPS.PLATFORM_ADMINS,
    create: ROLE_GROUPS.PLATFORM_ADMINS,
  },

  settings: {
    access: 'ALL',
    edit: 'ALL',
  },

  wallet: {
    access: [...ROLE_GROUPS.ALL_AUTHENTICATED],
    view: [...ROLE_GROUPS.ALL_AUTHENTICATED],
    withdraw: ['OWNER', 'SITE_OWNER', 'TECHNICIAN_ORG', 'TECHNICIAN_PUBLIC'],
  },

  techRequests: {
    access: ['OWNER', 'STATION_ADMIN', ...ROLE_GROUPS.TECHNICIANS],
    view: ['OWNER', 'STATION_ADMIN', ...ROLE_GROUPS.TECHNICIANS],
    create: ['OWNER', 'STATION_ADMIN'],
    assign: ['OWNER', 'STATION_ADMIN'],
    accept: ROLE_GROUPS.TECHNICIANS,
  },

  addCharger: {
    access: ['OWNER', 'STATION_ADMIN'],
    create: ['OWNER', 'STATION_ADMIN'],
  },

  technicianJobs: {
    access: ROLE_GROUPS.TECHNICIANS,
    view: ROLE_GROUPS.TECHNICIANS,
    accept: ROLE_GROUPS.TECHNICIANS,
    complete: ROLE_GROUPS.TECHNICIANS,
    invoice: ROLE_GROUPS.TECHNICIANS,
  },

  onboarding: {
    access: 'ALL',
  },

  auth: {
    access: 'ALL',
  },

  'charge-points': {
    access: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN', 'MANAGER'],
    view: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN', 'MANAGER'],
    create: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
    edit: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
    delete: [...ROLE_GROUPS.PLATFORM_ADMINS, 'OWNER'],
    remoteCommands: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN'],
  },
}

/** Check if a role has a specific permission for a feature */
export function hasPermission(
  role: Role | undefined,
  feature: keyof typeof PERMISSIONS,
  permission: string = 'access'
): boolean {
  if (!role) return false
  if (role === 'SUPER_ADMIN') return true

  const featurePerms = PERMISSIONS[feature]
  if (!featurePerms) return false

  const perm = featurePerms[permission]
  if (!perm) return false
  if (perm === 'ALL') return true

  return (perm as Role[]).includes(role)
}

/** Get all permissions for a role on a feature */
export function getPermissionsForFeature(
  role: Role | undefined,
  feature: keyof typeof PERMISSIONS
): Record<string, boolean> {
  if (!role) return {}
  if (role === 'SUPER_ADMIN') {
    const featurePerms = PERMISSIONS[feature]
    if (!featurePerms) return {}
    const result: Record<string, boolean> = {}
    for (const key of Object.keys(featurePerms)) {
      result[key] = true
    }
    return result
  }

  const featurePerms = PERMISSIONS[feature]
  if (!featurePerms) return {}

  const result: Record<string, boolean> = {}
  for (const [key, perm] of Object.entries(featurePerms)) {
    if (perm === undefined) continue
    if (perm === 'ALL') {
      result[key] = true
    } else {
      result[key] = (perm as Role[]).includes(role)
    }
  }
  return result
}

