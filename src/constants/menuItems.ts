import type { Role } from '@/core/auth/types'
import { ROLE_GROUPS } from './roles'
import { PATHS } from '@/app/router/paths'

export type MenuItem = {
  path: string
  label: string
  icon?: string
  /** Roles that can see this menu item. 'ALL' means all roles */
  roles: Role[] | 'ALL'
  /** Sub-items for nested menus */
  children?: MenuItem[]
  /** Badge count (optional) */
  badge?: number
  /** Whether this is a divider */
  divider?: boolean
}

/** Main sidebar menu items - dynamically filtered based on role */
export const MENU_ITEMS: MenuItem[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // COMMON (All roles)
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.DASHBOARD, label: 'Dashboard', icon: 'home', roles: 'ALL' },
  { path: PATHS.MARKETPLACE, label: 'Marketplace', icon: 'briefcase', roles: 'ALL' },
  { path: PATHS.EXPLORE, label: 'Explore', icon: 'map', roles: 'ALL' },

  // ═══════════════════════════════════════════════════════════════════════
  // OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.STATIONS.ROOT, label: 'Stations', icon: 'zap', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'STATION_ADMIN', 'MANAGER'] },
  { path: PATHS.SESSIONS, label: 'Sessions', icon: 'activity', roles: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_STAFF] },
  { path: PATHS.INCIDENTS, label: 'Incidents', icon: 'alert-triangle', roles: [...ROLE_GROUPS.PLATFORM_OPS, ...ROLE_GROUPS.STATION_MANAGERS, ...ROLE_GROUPS.TECHNICIANS] },
  { path: PATHS.DISPATCHES, label: 'Dispatches', icon: 'truck', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'MANAGER', ...ROLE_GROUPS.TECHNICIANS] },

  // ═══════════════════════════════════════════════════════════════════════
  // OWNER-SPECIFIC
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.OWNER.TARIFFS, label: 'Tariffs & Pricing', icon: 'dollar-sign', roles: ['OWNER', 'STATION_ADMIN'] },

  // ═══════════════════════════════════════════════════════════════════════
  // SITE OWNER
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.SITE_OWNER.SITES, label: 'My Sites', icon: 'map-pin', roles: ['SITE_OWNER'] },
  { path: PATHS.SITE_OWNER.PARKING, label: 'Parking', icon: 'truck', roles: ['SITE_OWNER'] },
  { path: PATHS.SITE_OWNER.TENANTS, label: 'Tenants', icon: 'users', roles: ['SITE_OWNER'] },

  // ═══════════════════════════════════════════════════════════════════════
  // TECHNICIAN
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.TECH.JOBS, label: 'Jobs', icon: 'tool', roles: ROLE_GROUPS.TECHNICIANS },
  { path: PATHS.TECH.TECH_JOBS, label: 'My Jobs', icon: 'briefcase', roles: ROLE_GROUPS.TECHNICIANS },
  { path: PATHS.TECH.AVAILABILITY, label: 'Availability', icon: 'clock', roles: ROLE_GROUPS.TECHNICIANS },

  // ═══════════════════════════════════════════════════════════════════════
  // TEAM & USERS
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.TEAM, label: 'Team', icon: 'users', roles: ['STATION_ADMIN'] },
  { path: PATHS.ADMIN.USERS, label: 'Users & Roles', icon: 'user-check', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.APPROVALS, label: 'Approvals', icon: 'check-circle', roles: ROLE_GROUPS.PLATFORM_OPS },

  // ═══════════════════════════════════════════════════════════════════════
  // FINANCIAL
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.BILLING, label: 'Billing', icon: 'credit-card', roles: ROLE_GROUPS.FINANCIAL_VIEWERS },
  { path: PATHS.OWNER.EARNINGS, label: 'Earnings', icon: 'trending-up', roles: ['OWNER', 'SITE_OWNER'] },
  { path: PATHS.ADMIN.DISPUTES, label: 'Disputes', icon: 'alert-circle', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER'] },
  { path: PATHS.REPORTS, label: 'Reports', icon: 'file-text', roles: [...ROLE_GROUPS.PLATFORM_OPS, 'OWNER', 'SITE_OWNER'] },

  // ═══════════════════════════════════════════════════════════════════════
  // COMMUNICATIONS
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.NOTIFICATIONS, label: 'Notifications', icon: 'bell', roles: 'ALL' },
  { path: PATHS.ADMIN.BROADCASTS, label: 'Broadcasts', icon: 'radio', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.WEBHOOKS_LOG, label: 'Webhooks Log', icon: 'activity', roles: ROLE_GROUPS.PLATFORM_ADMINS },

  // ═══════════════════════════════════════════════════════════════════════
  // COMPLIANCE & GOVERNANCE
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.ADMIN.KYC, label: 'KYC & Compliance', icon: 'shield', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.AUDIT_LOGS, label: 'Audit Logs', icon: 'file-text', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ADMIN.PRIVACY, label: 'Privacy Requests', icon: 'lock', roles: ROLE_GROUPS.PLATFORM_ADMINS },

  // ═══════════════════════════════════════════════════════════════════════
  // PLATFORM ADMIN
  // ═══════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════
  // NEW PORTED FEATURES
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.CONTENT, label: 'Content', icon: 'file-text', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.OPENADR, label: 'OpenADR', icon: 'zap', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.ROAMING, label: 'Roaming', icon: 'globe', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.REGULATORY, label: 'Regulatory', icon: 'shield', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.UTILITY, label: 'Utility', icon: 'grid', roles: ROLE_GROUPS.PLATFORM_ADMINS },
  { path: PATHS.OWNER.PARTNERS, label: 'Partners', icon: 'users', roles: ROLE_GROUPS.PLATFORM_ADMINS },

  // ═══════════════════════════════════════════════════════════════════════
  // USER TOOLS (All authenticated users)
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.WALLET, label: 'Wallet', icon: 'credit-card', roles: ['OWNER', 'SITE_OWNER', 'TECHNICIAN_ORG', 'TECHNICIAN_PUBLIC'] },
  { path: PATHS.SETTING, label: 'Settings', icon: 'settings', roles: 'ALL' },

  // ═══════════════════════════════════════════════════════════════════════
  // OWNER TOOLS
  // ═══════════════════════════════════════════════════════════════════════
  { path: PATHS.OWNER.TECH_REQUESTS, label: 'Tech Requests', icon: 'tool', roles: ['OWNER', 'STATION_ADMIN'] },
]

/** Get menu items visible to a specific role */
export function getMenuItemsForRole(role: Role | undefined): MenuItem[] {
  if (!role) return []
  if (role === 'SUPER_ADMIN') return MENU_ITEMS

  return MENU_ITEMS.filter(item => {
    if (item.roles === 'ALL') return true
    return item.roles.includes(role)
  })
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

