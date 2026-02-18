import type { Role } from '@/core/auth/types'
import { ROLE_GROUPS } from './roles'
import { PATHS } from '@/app/router/paths'
import { hasPermission } from './permissions'

export type MenuItem = {
  path: string
  label: string
  icon?: string
  section?: string
  /** Roles that can see this menu item. 'ALL' means all roles */
  roles: Role[] | 'ALL'
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

const COMMON = section('Common', [
  { path: PATHS.DASHBOARD, label: 'Dashboard', icon: 'home', roles: 'ALL' },
  { path: PATHS.MARKETPLACE, label: 'Marketplace', icon: 'briefcase', roles: 'ALL' },
])

const OPERATIONS = section('Operations', [
  { path: PATHS.STATIONS.ROOT, label: 'Stations', icon: 'zap', roles: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_MANAGERS] },
  { path: PATHS.SESSIONS, label: 'Sessions', icon: 'activity', roles: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_STAFF] },
  { path: PATHS.INCIDENTS, label: 'Incidents', icon: 'alert-triangle', roles: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_MANAGERS, ...ROLE_GROUPS.TECHNICIANS] },
  { path: PATHS.DISPATCHES, label: 'Dispatches', icon: 'truck', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'MANAGER', ...ROLE_GROUPS.TECHNICIANS] },
])

const OWNER_SPECIFIC = section('Owner-Specific', [
  { path: PATHS.OWNER.TARIFFS, label: 'Tariffs & Pricing', icon: 'dollar-sign', roles: ['STATION_OPERATOR', 'STATION_ADMIN', 'STATION_OWNER'] },
])

const SITE_OWNER = section('Site Owner', [
  { path: PATHS.SITE_OWNER.SITES, label: 'My Sites', icon: 'map-pin', roles: ['SITE_OWNER', 'STATION_OWNER'] },
  { path: PATHS.SITE_OWNER.PARKING, label: 'Parking', icon: 'truck', roles: ['SITE_OWNER'] },
  { path: PATHS.SITE_OWNER.TENANTS, label: 'Tenants', icon: 'users', roles: ['SITE_OWNER'] },
])

const TECHNICIAN = section('Technician', [
  { path: PATHS.TECH.JOBS, label: 'Jobs', icon: 'tool', roles: ROLE_GROUPS.TECHNICIANS },
  { path: PATHS.TECH.TECH_JOBS, label: 'My Jobs', icon: 'briefcase', roles: ROLE_GROUPS.TECHNICIANS },
  { path: PATHS.TECH.AVAILABILITY, label: 'Availability', icon: 'clock', roles: ROLE_GROUPS.TECHNICIANS },
])

const TEAM_USERS = section('Team & Users', [
  { path: PATHS.TEAM, label: 'Team', icon: 'users', roles: ['STATION_ADMIN', 'STATION_OPERATOR', 'STATION_OWNER'] },
  { path: PATHS.ADMIN.USERS, label: 'Users & Roles', icon: 'user-check', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.APPROVALS, label: 'Approvals', icon: 'check-circle', roles: ROLE_GROUPS.PLATFORM_OPS },
])

const FINANCIAL = section('Financial', [
  { path: PATHS.BILLING, label: 'Billing', icon: 'credit-card', roles: [...ROLE_GROUPS.FINANCIAL_VIEWERS, 'STATION_OPERATOR', 'SITE_OWNER'] },
  { path: PATHS.OWNER.EARNINGS, label: 'Earnings', icon: 'trending-up', roles: ['STATION_OPERATOR', 'SITE_OWNER', 'STATION_OWNER'] },
  { path: PATHS.ADMIN.DISPUTES, label: 'Disputes', icon: 'alert-circle', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'STATION_OPERATOR', 'STATION_OWNER'] },
  { path: PATHS.REPORTS, label: 'Reports', icon: 'file-text', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'STATION_OPERATOR', 'SITE_OWNER', 'STATION_OWNER'] },
])

const COMMUNICATIONS = section('Communications', [
  { path: PATHS.NOTIFICATIONS, label: 'Notifications', icon: 'bell', roles: 'ALL' },
  { path: PATHS.ADMIN.BROADCASTS, label: 'Broadcasts', icon: 'radio', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.WEBHOOKS_LOG, label: 'Webhooks Log', icon: 'activity', roles: ROLE_GROUPS.PLATFORM_ADMINS },
])

const COMPLIANCE_GOVERNANCE = section('Compliance & Governance', [
  { path: PATHS.ADMIN.KYC, label: 'KYC & Compliance', icon: 'shield', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.AUDIT_LOGS, label: 'Audit Logs', icon: 'file-text', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.PRIVACY, label: 'Privacy Requests', icon: 'lock', roles: ROLE_GROUPS.PLATFORM_ADMINS },
])

const PLATFORM_ADMIN = section('Platform Admin', [
  { path: PATHS.ADMIN.SYSTEM_HEALTH, label: 'System Health', icon: 'heart', roles: ROLE_GROUPS.PLATFORM_OPS },
  { path: PATHS.ADMIN.PROTOCOLS, label: 'Protocols', icon: 'server', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.SETTLEMENT, label: 'Settlement', icon: 'dollar-sign', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.PLANS, label: 'Plans & Pricing', icon: 'layers', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.FEATURE_FLAGS, label: 'Feature Flags', icon: 'toggle-left', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.INTEGRATIONS, label: 'Integrations', icon: 'link', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.WEBHOOKS, label: 'Webhooks', icon: 'share-2', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.STATUS, label: 'Status Page', icon: 'monitor', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.SUPPORT, label: 'Support Desk', icon: 'headphones', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.CRM, label: 'CRM', icon: 'briefcase', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.GLOBAL_CONFIG, label: 'Settings', icon: 'settings', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.ROLES, label: 'Roles & Permissions', icon: 'lock', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.ORGS, label: 'Organizations', icon: 'building', roles: ROLE_GROUPS.PLATFORM_ADMINS },
])

const NEW_PORTED_FEATURES = section('New Ported Features', [
  { path: PATHS.CONTENT, label: 'Content', icon: 'file-text', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.OPENADR, label: 'OpenADR', icon: 'zap', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ROAMING, label: 'Roaming', icon: 'globe', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.REGULATORY, label: 'Regulatory', icon: 'shield', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.UTILITY, label: 'Utility', icon: 'grid', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.OWNER.PROVIDERS, label: 'Swapping Providers', icon: 'share-2', roles: ROLE_GROUPS.PLATFORM_OPS },
  { path: PATHS.OWNER.PARTNERS, label: 'Partners', icon: 'users', roles: ROLE_GROUPS.PLATFORM_ADMINS },
])

const USER_TOOLS = section('User Tools', [
  { path: PATHS.PROVIDER.DASHBOARD, label: 'Provider Portal', icon: 'briefcase', roles: ROLE_GROUPS.PROVIDER_ROLES },
  { path: PATHS.WALLET, label: 'Wallet', icon: 'credit-card', roles: ['STATION_OPERATOR', 'SITE_OWNER', 'TECHNICIAN_ORG', 'TECHNICIAN_PUBLIC', 'STATION_OWNER'] },
  { path: PATHS.SETTING, label: 'Settings', icon: 'settings', roles: 'ALL' },
])

const OWNER_TOOLS = section('Owner Tools', [
  { path: PATHS.OWNER.TECH_REQUESTS, label: 'Tech Requests', icon: 'tool', roles: ['STATION_OPERATOR', 'STATION_ADMIN', 'STATION_OWNER'] },
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

/** Get menu items visible to a specific role */
export function getMenuItemsForRole(role: Role | undefined): MenuItem[] {
  if (!role) return []
  if (role === 'SUPER_ADMIN') return MENU_ITEMS

  // For predefined roles, use the standard role-based filtering
  const roleBasedItems = MENU_ITEMS.filter(item => {
    if (item.roles === 'ALL') return true
    return item.roles.includes(role)
  })

  // If we got menu items from role-based filtering, use those
  if (roleBasedItems.length > 0) {
    return roleBasedItems
  }

  // For custom roles (no menu items found), generate menu based on permissions
  // This allows custom roles created by STATION_OPERATOR to have dynamic menus
  return generateMenuFromPermissions(role)
}

/** Generate menu items based on role permissions (for custom roles) */
function generateMenuFromPermissions(role: Role): MenuItem[] {
  const permissionBasedMenu: MenuItem[] = []
  const addToSection = (sectionName: string, item: MenuItem) => {
    permissionBasedMenu.push({
      ...item,
      section: sectionName,
      children: item.children?.map((child) => ({ ...child, section: sectionName })),
    })
  }

  // Add common items
  addToSection('Common', { path: PATHS.DASHBOARD, label: 'Dashboard', icon: 'home', roles: 'ALL' })
  addToSection('Common', { path: PATHS.MARKETPLACE, label: 'Marketplace', icon: 'briefcase', roles: 'ALL' })

  // Add permission-based items
  if (hasPermission(role, 'stations', 'access')) {
    addToSection('Operations', { path: PATHS.STATIONS.ROOT, label: 'Stations', icon: 'zap', roles: [role] })
  }
  if (hasPermission(role, 'sessions', 'access')) {
    addToSection('Operations', { path: PATHS.SESSIONS, label: 'Sessions', icon: 'activity', roles: [role] })
  }
  if (hasPermission(role, 'incidents', 'access')) {
    addToSection('Operations', { path: PATHS.INCIDENTS, label: 'Incidents', icon: 'alert-triangle', roles: [role] })
  }
  if (hasPermission(role, 'tariffs', 'access')) {
    addToSection('Owner-Specific', { path: PATHS.OWNER.TARIFFS, label: 'Tariffs & Pricing', icon: 'dollar-sign', roles: [role] })
  }
  if (hasPermission(role, 'team', 'access')) {
    addToSection('Team & Users', { path: PATHS.TEAM, label: 'Team', icon: 'users', roles: [role] })
  }
  if (hasPermission(role, 'billing', 'access')) {
    addToSection('Financial', { path: PATHS.BILLING, label: 'Billing', icon: 'credit-card', roles: [role] })
  }
  if (hasPermission(role, 'earnings', 'access')) {
    addToSection('Financial', { path: PATHS.OWNER.EARNINGS, label: 'Earnings', icon: 'trending-up', roles: [role] })
  }
  if (hasPermission(role, 'disputes', 'access')) {
    addToSection('Financial', { path: PATHS.ADMIN.DISPUTES, label: 'Disputes', icon: 'alert-circle', roles: [role] })
  }
  if (hasPermission(role, 'reports', 'access')) {
    addToSection('Financial', { path: PATHS.REPORTS, label: 'Reports', icon: 'file-text', roles: [role] })
  }
  if (hasPermission(role, 'swapProviders', 'access')) {
    addToSection('Platform Admin', { path: PATHS.OWNER.PROVIDERS, label: 'Swapping Providers', icon: 'share-2', roles: [role] })
  }
  if (hasPermission(role, 'wallet', 'access')) {
    addToSection('User Tools', { path: PATHS.WALLET, label: 'Wallet', icon: 'credit-card', roles: [role] })
  }
  if (hasPermission(role, 'techRequests', 'access')) {
    addToSection('Owner Tools', { path: PATHS.OWNER.TECH_REQUESTS, label: 'Tech Requests', icon: 'tool', roles: [role] })
  }

  // Always add notifications and settings
  addToSection('Communications', { path: PATHS.NOTIFICATIONS, label: 'Notifications', icon: 'bell', roles: 'ALL' })
  addToSection('User Tools', { path: PATHS.SETTING, label: 'Settings', icon: 'settings', roles: 'ALL' })

  return permissionBasedMenu
}

/** Check if a role can access a specific path */
export function canAccessPath(role: Role | undefined, path: string): boolean {
  if (!role) return false
  if (role === 'SUPER_ADMIN') return true

  const item = MENU_ITEMS.find(m => m.path === path)
  if (!item) return true // Allow paths not in menu (like detail pages)

  if (item.roles === 'ALL') return true
  return item.roles.includes(role)
}
