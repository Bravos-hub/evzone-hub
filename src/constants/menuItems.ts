import type { Role, UserProfile } from '@/core/auth/types'
import { PATHS } from '@/app/router/paths'
import { capabilityAllowsCharge } from '@/core/auth/rbac'
import { ALL_ROLES, ROLE_GROUPS } from './roles'
import { hasPermission, type PermissionFeature } from './permissions'

export type MenuAudience = Role[] | 'ALL'

export type MenuUser = {
  role?: Role | string
  ownerCapability?: UserProfile['ownerCapability']
}

export type MenuItem = {
  path: string
  label: string
  icon?: string
  section?: string
  /** Sidebar audience. This can be narrower than route-level access. */
  roles: MenuAudience
  /** Permission gate used for both built-in and custom roles. */
  feature?: PermissionFeature
  permission?: string
  /** Optional additional visibility rules such as owner capability. */
  visibleWhen?: (user: MenuUser) => boolean
  /** Sub-items for nested menus */
  children?: MenuItem[]
  /** Badge count (optional) */
  badge?: number
  /** Whether this is a divider */
  divider?: boolean
}

const section = (title: string, items: MenuItem[]): MenuItem[] =>
  items.map((item) => ({
    ...item,
    section: title,
    children: item.children?.map((child) => ({
      ...child,
      section: title,
    })),
  }))

const isChargeCapableOwner = (user: MenuUser) =>
  !['STATION_OPERATOR', 'STATION_OWNER'].includes(String(user.role)) || capabilityAllowsCharge(user.ownerCapability)

const COMMON = section('Common', [
  { path: PATHS.DASHBOARD, label: 'Dashboard', icon: 'home', roles: 'ALL', feature: 'dashboard' },
  { path: PATHS.MARKETPLACE, label: 'Marketplace', icon: 'briefcase', roles: 'ALL' },
])

const OPERATIONS = section('Operations', [
  { path: PATHS.STATIONS.ROOT, label: 'Stations', icon: 'zap', roles: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_MANAGERS], feature: 'stations' },
  { path: PATHS.SESSIONS, label: 'Sessions', icon: 'activity', roles: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_STAFF], feature: 'sessions' },
  { path: PATHS.INCIDENTS, label: 'Incidents', icon: 'alert-triangle', roles: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_MANAGERS, ...ROLE_GROUPS.TECHNICIANS], feature: 'incidents' },
  { path: PATHS.DISPATCHES, label: 'Dispatches', icon: 'truck', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'MANAGER', ...ROLE_GROUPS.TECHNICIANS], feature: 'dispatches' },
])

const OWNER_SPECIFIC = section('Owner-Specific', [
  {
    path: PATHS.OWNER.TARIFFS,
    label: 'Tariffs & Pricing',
    icon: 'dollar-sign',
    roles: ['STATION_OPERATOR', 'STATION_ADMIN', 'STATION_OWNER'],
    feature: 'tariffs',
    visibleWhen: isChargeCapableOwner,
  },
])

const SITE_OWNER = section('Site Owner', [
  { path: PATHS.SITE_OWNER.SITES, label: 'Sites', icon: 'map-pin', roles: ['SITE_OWNER', 'STATION_OWNER'], feature: 'sites' },
  { path: PATHS.SITE_OWNER.PARKING, label: 'Parking', icon: 'truck', roles: ['SITE_OWNER'], feature: 'parking' },
  { path: PATHS.SITE_OWNER.TENANTS, label: 'Tenants', icon: 'users', roles: ['SITE_OWNER'], feature: 'tenants' },
])

const TECHNICIAN = section('Technician', [
  { path: PATHS.TECH.JOBS, label: 'Jobs', icon: 'tool', roles: ROLE_GROUPS.TECHNICIANS, feature: 'jobs' },
  { path: PATHS.TECH.TECH_JOBS, label: 'My Jobs', icon: 'briefcase', roles: ROLE_GROUPS.TECHNICIANS, feature: 'technicianJobs' },
  { path: PATHS.TECH.AVAILABILITY, label: 'Availability', icon: 'clock', roles: ROLE_GROUPS.TECHNICIANS, feature: 'technicianAvailability' },
])

const TEAM_USERS = section('Team & Users', [
  { path: PATHS.TEAM, label: 'Team', icon: 'users', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'STATION_ADMIN', 'STATION_OPERATOR', 'STATION_OWNER'], feature: 'team' },
  { path: PATHS.ADMIN.USERS, label: 'Users & Roles', icon: 'user-check', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'users' },
  { path: PATHS.ADMIN.APPROVALS, label: 'Approvals', icon: 'check-circle', roles: ROLE_GROUPS.PLATFORM_OPS, feature: 'approvals' },
])

const FINANCIAL = section('Financial', [
  { path: PATHS.BILLING, label: 'Billing', icon: 'credit-card', roles: [...ROLE_GROUPS.FINANCIAL_VIEWERS, 'STATION_OPERATOR', 'SITE_OWNER'], feature: 'billing' },
  { path: PATHS.OWNER.EARNINGS, label: 'Earnings', icon: 'trending-up', roles: ['STATION_OPERATOR', 'SITE_OWNER', 'STATION_OWNER'], feature: 'earnings' },
  { path: PATHS.ADMIN.DISPUTES, label: 'Disputes', icon: 'alert-circle', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'STATION_OPERATOR', 'STATION_OWNER'], feature: 'disputes' },
  { path: PATHS.REPORTS, label: 'Reports', icon: 'file-text', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'STATION_OPERATOR', 'SITE_OWNER', 'STATION_OWNER'], feature: 'reports' },
])

const COMMUNICATIONS = section('Communications', [
  { path: PATHS.NOTIFICATIONS, label: 'Notifications', icon: 'bell', roles: 'ALL', feature: 'notifications' },
  { path: PATHS.ADMIN.BROADCASTS, label: 'Broadcasts', icon: 'radio', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'broadcasts' },
  { path: PATHS.ADMIN.WEBHOOKS_LOG, label: 'Webhooks Log', icon: 'activity', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'webhooksLog' },
])

const COMPLIANCE_GOVERNANCE = section('Compliance & Governance', [
  { path: PATHS.ADMIN.KYC, label: 'KYC & Compliance', icon: 'shield', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'kycCompliance' },
  { path: PATHS.ADMIN.AUDIT_LOGS, label: 'Audit Logs', icon: 'file-text', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'auditLogs' },
  { path: PATHS.ADMIN.PRIVACY, label: 'Privacy Requests', icon: 'lock', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'privacyRequests' },
])

const PLATFORM_ADMIN = section('Platform Admin', [
  { path: PATHS.ADMIN.SYSTEM_HEALTH, label: 'System Health', icon: 'heart', roles: ROLE_GROUPS.PLATFORM_OPS, feature: 'systemHealth' },
  { path: PATHS.ADMIN.PROTOCOLS, label: 'Protocols', icon: 'server', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'protocols' },
  { path: PATHS.ADMIN.SETTLEMENT, label: 'Settlement', icon: 'dollar-sign', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'settlement' },
  { path: PATHS.ADMIN.PLANS, label: 'Plans & Pricing', icon: 'layers', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'plans' },
  { path: PATHS.ADMIN.FEATURE_FLAGS, label: 'Feature Flags', icon: 'toggle-left', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'featureFlags' },
  { path: PATHS.ADMIN.INTEGRATIONS, label: 'Integrations', icon: 'link', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'integrations' },
  { path: PATHS.ADMIN.WEBHOOKS, label: 'Webhooks', icon: 'share-2', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'webhooks' },
  { path: PATHS.ADMIN.STATUS, label: 'Status Page', icon: 'monitor', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'statusPage' },
  { path: PATHS.ADMIN.SUPPORT, label: 'Support Desk', icon: 'headphones', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'supportDesk' },
  { path: PATHS.ADMIN.CRM, label: 'CRM', icon: 'briefcase', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'crm' },
  { path: PATHS.ADMIN.GLOBAL_CONFIG, label: 'Settings', icon: 'settings', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'globalConfig' },
  { path: PATHS.ADMIN.ROLES, label: 'Roles & Permissions', icon: 'lock', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'rolesMatrix' },
  { path: PATHS.ADMIN.ORGS, label: 'Organizations', icon: 'building', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'organizations' },
  { path: PATHS.ADMIN.GEOGRAPHY, label: 'Geography', icon: 'globe', roles: ROLE_GROUPS.PLATFORM_OPS, feature: 'geography' },
])

const NEW_PORTED_FEATURES = section('New Ported Features', [
  { path: PATHS.CONTENT, label: 'Content', icon: 'file-text', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'content' },
  { path: PATHS.OPENADR, label: 'OpenADR', icon: 'zap', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'openadr' },
  { path: PATHS.ROAMING, label: 'Roaming', icon: 'globe', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'roaming' },
  { path: PATHS.REGULATORY, label: 'Regulatory', icon: 'shield', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'regulatory' },
  { path: PATHS.UTILITY, label: 'Utility', icon: 'grid', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'utility' },
  { path: PATHS.OWNER.PROVIDERS, label: 'Swapping Providers', icon: 'share-2', roles: ROLE_GROUPS.PLATFORM_OPS, feature: 'swapProviders' },
  { path: PATHS.OWNER.PARTNERS, label: 'Partners', icon: 'users', roles: ROLE_GROUPS.PLATFORM_ADMINS, feature: 'partners' },
])

const USER_TOOLS = section('User Tools', [
  { path: PATHS.PROVIDER.DASHBOARD, label: 'Provider Portal', icon: 'briefcase', roles: ROLE_GROUPS.PROVIDER_ROLES, feature: 'providerPortal' },
  { path: PATHS.WALLET, label: 'Wallet', icon: 'credit-card', roles: ['STATION_OPERATOR', 'SITE_OWNER', 'TECHNICIAN_ORG', 'TECHNICIAN_PUBLIC', 'STATION_OWNER'], feature: 'wallet' },
  { path: PATHS.SETTING, label: 'Settings', icon: 'settings', roles: 'ALL', feature: 'settings' },
])

const OWNER_TOOLS = section('Owner Tools', [
  { path: PATHS.OWNER.TECH_REQUESTS, label: 'Tech Requests', icon: 'tool', roles: ['STATION_OPERATOR', 'STATION_ADMIN', 'STATION_OWNER'], feature: 'techRequests' },
])

/** Main sidebar menu items - dynamically filtered based on role */
export const MENU_ITEMS: MenuItem[] = [
  ...COMMON,
  ...OPERATIONS,
  ...OWNER_SPECIFIC,
  ...SITE_OWNER,
  ...TECHNICIAN,
  ...TEAM_USERS,
  ...FINANCIAL,
  ...COMMUNICATIONS,
  ...COMPLIANCE_GOVERNANCE,
  ...PLATFORM_ADMIN,
  ...NEW_PORTED_FEATURES,
  ...USER_TOOLS,
  ...OWNER_TOOLS,
]

function isPredefinedRole(role: Role | string | undefined): role is Role {
  return Boolean(role && ALL_ROLES.includes(role as Role))
}

function isMenuItemVisibleForPredefinedUser(item: MenuItem, user: MenuUser): boolean {
  if (!user.role) return false
  if (user.role === 'SUPER_ADMIN') return true

  const inAudience = item.roles === 'ALL' || item.roles.includes(user.role as Role)
  if (!inAudience) return false

  if (item.feature && !hasPermission(user.role as Role, item.feature, item.permission ?? 'access')) {
    return false
  }

  return item.visibleWhen ? item.visibleWhen(user) : true
}

function isMenuItemVisibleFromPermission(item: MenuItem, user: MenuUser): boolean {
  if (!user.role) return false

  if (item.visibleWhen && !item.visibleWhen(user)) {
    return false
  }

  if (item.feature) {
    return hasPermission(user.role as Role, item.feature, item.permission ?? 'access')
  }

  return item.roles === 'ALL'
}

/** Get menu items visible to a specific authenticated user */
export function getMenuItemsForUser(user: MenuUser | undefined): MenuItem[] {
  if (!user?.role) return []
  if (user.role === 'SUPER_ADMIN') return MENU_ITEMS

  if (isPredefinedRole(user.role)) {
    return MENU_ITEMS.filter((item) => isMenuItemVisibleForPredefinedUser(item, user))
  }

  return MENU_ITEMS.filter((item) => isMenuItemVisibleFromPermission(item, user))
}

/** Check if a user can access a specific sidebar path */
export function canAccessPath(user: MenuUser | undefined, path: string): boolean {
  if (!user?.role) return false
  if (user.role === 'SUPER_ADMIN') return true

  const item = MENU_ITEMS.find((menuItem) => menuItem.path === path)
  if (!item) return true

  if (isPredefinedRole(user.role)) {
    return isMenuItemVisibleForPredefinedUser(item, user)
  }

  return isMenuItemVisibleFromPermission(item, user)
}
