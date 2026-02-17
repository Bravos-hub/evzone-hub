import type { DashboardConfig, DashboardKey } from './types'
import type { Role } from '@/core/auth/types'

import type { ChoroplethDatum } from '@/ui/components/WorldChoroplethMap'
import { hasPermission } from '@/constants/permissions'

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA - In production, this would come from API/stores
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA - In production, this would come from API/stores
// (Mock data definitions moved to individual widgets as defaults)
// ═══════════════════════════════════════════════════════════════════════════

const GENERIC_DASHBOARD: DashboardConfig = {
  title: 'Dashboard',
  kpiRow: [
    { id: 'kpi-generic', config: { title: 'Assigned Items', value: '—' } },
    { id: 'kpi-generic', config: { title: 'Open Tasks', value: '—' } },
    { id: 'kpi-generic', config: { title: 'Recent Alerts', value: '—' } },
  ],
  rows: [
    {
      widgets: [
        { id: 'panel-placeholder', size: 'full', config: { title: 'Welcome', subtitle: 'You have restricted access based on your custom role.' } },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

const ADMIN_DASHBOARD_CONFIG: DashboardConfig = {
  title: 'Admin Overview',
  kpiRow: [
    { id: 'kpi-stations', config: { variant: 'total' } },
    { id: 'kpi-stations', config: { variant: 'online' } },
    { id: 'kpi-incidents', config: { period: '24h' } },
    { id: 'kpi-stations', config: { variant: 'offline' } },
  ],
  rows: [
    {
      sectionTitle: 'Global Operations',
      widgets: [
        { id: 'map-world', size: '3', config: { title: 'Live Hotspots', subtitle: 'Regional metrics by station density' } },
        {
          id: 'panel-alerts', size: '1', config: {
            title: 'Vulnerabilities & Alerts',
          }
        },
      ],
    },
    {
      widgets: [
        { id: 'list-incidents', size: '2', config: { title: 'Incidents' } },
        { id: 'list-dispatch', size: '2', config: { title: 'Dispatch Queue' } },
      ],
    },
    {
      widgets: [
        {
          id: 'panel-settlement', size: '2', config: {
            title: 'Exchange & Settlement'
          }
        },
        { id: 'panel-health', size: '2', config: { title: 'System Health' } },
      ],
    },
    {
      widgets: [
        { id: 'panel-performance', size: 'full', config: { title: 'Performance Distribution' } },
      ],
    },
  ],
}

export const DASHBOARD_CONFIGS: Record<DashboardKey, DashboardConfig> = {
  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  EVZONE_ADMIN: ADMIN_DASHBOARD_CONFIG,
  SUPER_ADMIN: {
    ...ADMIN_DASHBOARD_CONFIG,
    title: 'Super Admin Overview',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OPERATOR DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  EVZONE_OPERATOR: {
    title: 'Operator Overview',
    kpiRow: [
      { id: 'kpi-uptime', config: {} },
      { id: 'kpi-stations', config: { variant: 'offline' } },
      { id: 'kpi-generic', config: { title: 'Approvals pending', value: '—' } },
      { id: 'kpi-sessions', config: { period: 'Today' } },
    ],
    rows: [
      {
        sectionTitle: 'Stations & Incidents',
        widgets: [
          { id: 'map-world', size: '2', config: { title: 'Regional Map', subtitle: 'Online/offline by region' } },
          { id: 'list-incidents', size: '2', config: { title: 'Top Incidents' } },
        ],
      },
      {
        sectionTitle: 'Handoff & Ops',
        widgets: [
          { id: 'panel-shift-handoff', size: 'full', config: {} },
        ],
      },
      {
        sectionTitle: 'Approvals & Dispatch',
        widgets: [
          { id: 'list-approvals', size: '2', config: { title: 'Approvals Queue' } },
          { id: 'list-dispatch', size: '2', config: { title: 'Dispatch Board' } },
        ],
      },
      {
        sectionTitle: 'Governance',
        widgets: [
          { id: 'list-audit', size: '2', config: { title: 'Recent Actions' } },
          { id: 'panel-settlement', size: '2', config: { title: 'Settlement Exceptions' } },
        ],
      },
    ],
  },



  // ─────────────────────────────────────────────────────────────────────────
  // SITE OWNER DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  SWAP_PROVIDER_ADMIN: {
    title: 'Provider Dashboard',
    kpiRow: [
      { id: 'kpi-generic', config: { title: 'Active Contracts', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Pending Requests', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Open Compliance Items', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Net Payable', value: '—' } },
    ],
    rows: [
      {
        sectionTitle: 'Provider Operations',
        widgets: [
          {
            id: 'panel-quick-actions',
            size: '2',
            config: {
              title: 'Quick Actions',
              actions: [
                { label: 'Open Provider Portal', path: '/provider/dashboard', variant: 'primary' },
                { label: 'Review Contracts', path: '/provider/dashboard', variant: 'secondary' },
                { label: 'Compliance Docs', path: '/provider/dashboard', variant: 'secondary' },
              ],
            },
          },
          { id: 'panel-placeholder', size: '2', config: { title: 'Settlement Snapshot', subtitle: 'Receivables, paid and pending' } },
        ],
      },
    ],
  },

  SWAP_PROVIDER_OPERATOR: {
    title: 'Provider Operations',
    kpiRow: [
      { id: 'kpi-generic', config: { title: 'Assigned Contracts', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Pending Responses', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Compliance To-Do', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Stations Linked', value: '—' } },
    ],
    rows: [
      {
        widgets: [
          { id: 'panel-placeholder', size: 'full', config: { title: 'Provider Ops Board', subtitle: 'Contracts, docs and settlement statements' } },
        ],
      },
    ],
  },

  SITE_OWNER: {
    title: 'Site Owner Overview',
    kpiRow: [
      { id: 'kpi-site-count', config: { type: 'listed' } },
      { id: 'kpi-site-count', config: { type: 'leased' } },
      { id: 'kpi-generic', config: { title: 'New applications', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Available Balance', value: '—' } },
    ],
    rows: [
      {
        sectionTitle: 'Quick Actions',
        widgets: [
          {
            id: 'panel-quick-actions', size: 'full', config: {
              title: 'Site Management Actions',
              actions: [
                { label: 'Add Site', path: '/site-owner-sites', variant: 'primary' },
                { label: 'View Tenants', path: '/tenants', variant: 'secondary' },
                { label: 'Withdraw Funds', path: '/site-owner/withdrawals', variant: 'secondary' },
                { label: 'Manage Parking', path: '/parking', variant: 'secondary' },
              ]
            }
          }
        ]
      },
      {
        sectionTitle: 'My Sites & Availability',
        widgets: [
          { id: 'panel-sites-table', size: 'full', config: { title: 'My Sites & Availability' } },
        ],
      },
      {
        sectionTitle: 'Applications Pipeline',
        widgets: [
          { id: 'panel-apps-table', size: 'full', config: { title: 'Applications Pipeline' } },
        ],
      },
      {
        sectionTitle: 'Leases & Earnings',
        widgets: [
          { id: 'panel-leases-table', size: '2', config: { title: 'Active leases', subtitle: 'Rent, term, contacts' } },
          { id: 'chart-line', size: '2', config: { title: 'Earnings trend', stroke: '#03cd8c' } },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STATION OWNER DASHBOARD (Maps to OWNER / CPO)
  // ─────────────────────────────────────────────────────────────────────────
  STATION_OWNER: {
    title: 'Owner Dashboard',
    kpiRow: [
      { id: 'kpi-revenue', config: { period: 'Today', trend: 'up' } },
      { id: 'kpi-swaps', config: {} },
      { id: 'kpi-sessions', config: { period: 'Today' } },
      { id: 'kpi-uptime', config: { trend: 'up' } },
    ],
    rows: [
      {
        sectionTitle: 'Operational Workflow',
        widgets: [
          { id: 'panel-owner-workflow', size: 'full', config: {} },
        ],
      },
      {
        sectionTitle: 'Analytics & Hardware',
        widgets: [
          { id: 'panel-revenue-chart', size: '2', config: { title: 'Combined Revenue' } },
          { id: 'panel-status-donut', size: '2', config: { title: 'Hardware Status' } },
        ],
      },
      {
        sectionTitle: 'Operations & Health',
        widgets: [
          { id: 'panel-utilization-heatmap', size: 'full', config: {} },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STATION ADMIN DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  STATION_ADMIN: {
    title: 'Station Admin',
    kpiRow: [
      { id: 'kpi-stations', config: { variant: 'online' } },
      { id: 'kpi-sessions', config: { period: 'Today' } },
      { id: 'kpi-incidents', config: { period: 'Open' } },
      { id: 'kpi-utilization', config: {} },
    ],
    rows: [
      {
        sectionTitle: 'Station Operations',
        widgets: [
          { id: 'panel-placeholder', size: '2', config: { title: 'Station status', subtitle: 'Connectors, queues, alerts' } },
          { id: 'list-incidents', size: '2', config: { title: 'Station Incidents' } },
        ],
      },
      {
        sectionTitle: 'Team & Performance',
        widgets: [
          { id: 'panel-placeholder', size: '2', config: { title: 'Shift schedule', subtitle: 'Today\'s coverage' } },
          { id: 'chart-bar', size: '2', config: { title: 'Daily Sessions', color: '#f77f00' } },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STATION OPERATOR DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  STATION_OPERATOR: {
    title: 'Station Operator Dashboard',
    kpiRow: [
      { id: 'kpi-stations', config: { variant: 'online' } },
      { id: 'kpi-revenue', config: { period: 'Today' } },
      { id: 'kpi-sessions', config: { period: 'Today' } },
      { id: 'kpi-uptime', config: {} },
    ],
    rows: [
      {
        sectionTitle: 'Quick Actions & Network',
        widgets: [
          { id: 'map-world', size: '2', config: { title: 'Regional Map', subtitle: 'Station metrics' } },
          {
            id: 'panel-quick-actions', size: '2', config: {
              title: 'Operational Control',
              actions: [
                { label: 'Manage Stations', path: '/stations', variant: 'primary' },
                { label: 'View Sessions', path: '/sessions', variant: 'secondary' },
                { label: 'Report Incident', path: '/incidents', variant: 'secondary' },
                { label: 'Manage Team', path: '/team', variant: 'secondary' },
              ]
            }
          }
        ]
      },
      {
        sectionTitle: 'Revenue & Utilization',
        widgets: [
          { id: 'panel-revenue-chart', size: '2', config: { title: 'Revenue Trends', subtitle: 'Last 7 days' } },
          { id: 'panel-utilization-heatmap', size: '2', config: { title: 'Station Utilization', subtitle: 'Peak hours analysis' } },
        ],
      },
      {
        sectionTitle: 'Operations & Incidents',
        widgets: [
          { id: 'list-incidents', size: '2', config: { title: 'Active Incidents' } },
          { id: 'chart-bar', size: '2', config: { title: 'Daily Sessions', color: '#f77f00' } },
        ],
      },
      {
        sectionTitle: 'Team & Performance',
        widgets: [
          { id: 'panel-team-activity', size: '2', config: { title: 'Team Activity', subtitle: 'Recent actions and updates' } },
          { id: 'panel-placeholder', size: '2', config: { title: 'Maintenance Queue', subtitle: 'Pending work orders and tech requests' } },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MANAGER DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  MANAGER: {
    title: 'Manager Overview',
    kpiRow: [
      { id: 'kpi-generic', config: { title: 'Assigned stations', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Staff on shift', value: '—' } },
      { id: 'kpi-incidents', config: { period: 'Open' } },
      { id: 'kpi-generic', config: { title: 'CSAT (7d)', value: '—' } },
    ],
    rows: [
      {
        sectionTitle: 'Stations Overview & Live Status',
        widgets: [
          { id: 'panel-stations-status', size: '2', config: {} },
          { id: 'panel-placeholder', size: '2', config: { title: 'Live ops snapshot', subtitle: 'Sessions, queues, downtime' } },
        ],
      },
      {
        sectionTitle: 'Attendants & Shifts',
        widgets: [
          { id: 'panel-shift-board', size: '2', config: {} },
          { id: 'panel-placeholder', size: '2', config: { title: 'Attendant performance', subtitle: 'Check-ins, notes, errors' } },
        ],
      },
      {
        sectionTitle: 'Incidents & Maintenance',
        widgets: [
          { id: 'list-incidents', size: '2', config: { title: 'Incidents queue' } },
          { id: 'list-dispatch', size: '2', config: { title: 'Maintenance requests' } },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ATTENDANT DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  ATTENDANT: {
    title: 'Station Attendant Dashboard',
    kpiRow: [
      { id: 'kpi-generic', config: { title: 'Assigned station', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Charges today', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Swaps today', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Bookings today', value: '—' } },
    ],
    rows: [
      {
        sectionTitle: 'Station Overview',
        widgets: [
          { id: 'panel-station-assignment', size: '2', config: {} },
          { id: 'panel-bookings-queue', size: '2', config: { stationName: 'Central Hub' } },
        ],
      },
      {
        sectionTitle: 'Charging Operations',
        widgets: [
          { id: 'panel-sessions-console', size: '2', config: { title: 'Live charging sessions', subtitle: 'Active bays for assigned station' } },
          { id: 'panel-charge-start', size: '2', config: { tips: ['Verify connector', 'Assign bay', 'Confirm rate'] } },
        ],
      },
      {
        sectionTitle: 'Swap Operations',
        widgets: [
          { id: 'panel-swap-flow', size: 'full', config: {} },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TECHNICIAN ORG DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  TECHNICIAN_ORG: {
    title: 'Technician — Org',
    kpiRow: [
      { id: 'kpi-generic', config: { title: 'Jobs open', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Due today', value: '—' } },
      { id: 'kpi-generic', config: { title: 'SLA at risk', value: '—' } },
      { id: 'kpi-generic', config: { title: 'First-time fix', value: '—' } },
    ],
    rows: [
      {
        sectionTitle: 'Job Queue & Priorities',
        widgets: [
          { id: 'list-dispatch', size: '2', config: { title: 'My jobs list' } },
          { id: 'panel-placeholder', size: '2', config: { title: 'Job timeline', subtitle: 'New → in progress → done' } },
        ],
      },
      {
        sectionTitle: 'Diagnostics & Station History',
        widgets: [
          { id: 'panel-placeholder', size: '2', config: { title: 'Asset diagnostics', subtitle: 'Charger/battery/locker health' } },
          { id: 'panel-placeholder', size: '2', config: { title: 'Fault history', subtitle: 'Recurring issues' } },
        ],
      },
      {
        sectionTitle: 'Parts & Performance',
        widgets: [
          { id: 'panel-placeholder', size: '2', config: { title: 'Parts / inventory', subtitle: 'Requests, availability' } },
          { id: 'panel-placeholder', size: '2', config: { title: 'Recent closures', subtitle: 'First-time fix, repeats' } },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TECHNICIAN PUBLIC DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  TECHNICIAN_PUBLIC: {
    // ...
    title: 'Technician — Public',
    kpiRow: [
      { id: 'kpi-generic', config: { title: 'Available jobs', value: '—' } },
      { id: 'kpi-generic', config: { title: 'My active', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Completed (30d)', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Rating', value: '—' } },
    ],
    rows: [
      {
        sectionTitle: 'Available Jobs',
        widgets: [
          { id: 'list-dispatch', size: '2', config: { title: 'Job board' } },
          { id: 'panel-placeholder', size: '2', config: { title: 'Job map', subtitle: 'Nearby opportunities' } },
        ],
      },
      {
        sectionTitle: 'My Work',
        widgets: [
          { id: 'panel-placeholder', size: '2', config: { title: 'Current job', subtitle: 'Details, checklist, submit' } },
          { id: 'panel-placeholder', size: '2', config: { title: 'Earnings', subtitle: 'This month, pending payout' } },
        ],
      },
    ],
  },
  CASHIER: {
    title: 'Cashier Dashboard',
    kpiRow: [
      { id: 'kpi-generic', config: { title: 'Transactions today', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Collections', value: '—' } },
      { id: 'kpi-generic', config: { title: 'Pending', value: '—' } },
    ],
    rows: [
      {
        widgets: [
          { id: 'panel-placeholder', size: '4', config: { title: 'Recent Payments', subtitle: 'Confirm and issue receipts' } },
        ],
      },
    ],
  },
}

/** Get dashboard config for a role, handling OWNER sub-types */
export function getDashboardConfig(
  role: DashboardKey,
  ownerCapability?: 'CHARGE' | 'SWAP' | 'BOTH'
): DashboardConfig | null {

  // Dynamic Station Owner Logic
  if (role === 'STATION_OWNER') {
    const baseConfig = DASHBOARD_CONFIGS.STATION_OWNER
    if (!ownerCapability || ownerCapability === 'BOTH') return baseConfig

    // Shallow clone to modify for capabilities
    const config = { ...baseConfig, kpiRow: [...baseConfig.kpiRow], rows: [...baseConfig.rows] }

    if (ownerCapability === 'CHARGE') {
      config.title = 'Charge Station Dashboard'
      // Remove Swap KPIs
      config.kpiRow = config.kpiRow.filter(k => k.id !== 'kpi-swaps')
    } else if (ownerCapability === 'SWAP') {
      config.title = 'Swap Station Dashboard'
      // Remove Charge KPIs if necessary (Sessions is generic, but usually Charge usually uses kpi-active-sessions)
      // Keeping generic sessions for now
    }
    return config
  }

  if (DASHBOARD_CONFIGS[role]) {
    return DASHBOARD_CONFIGS[role]
  }

  // Fallback: Generate dynamic dashboard based on permissions
  return generateDashboardFromPermissions(role)
}

/** 
 * Generate a dynamic dashboard configuration based on permissions.
 * Useful for custom roles that don't have a static config.
 */
function generateDashboardFromPermissions(roleKey: DashboardKey): DashboardConfig {
  const role = roleKey as Role

  const kpiRow: any[] = []
  const actions: any[] = []
  const contentWidgets: any[] = []

  // 1. Build KPIs based on access
  if (hasPermission(role, 'stations', 'access')) {
    kpiRow.push({ id: 'kpi-stations', config: { variant: 'online' } })
  }
  if (hasPermission(role, 'sessions', 'access')) {
    kpiRow.push({ id: 'kpi-sessions', config: { period: 'Today' } })
  }
  if (hasPermission(role, 'incidents', 'access')) {
    kpiRow.push({ id: 'kpi-incidents', config: { period: 'Open' } })
  }
  if (hasPermission(role, 'billing', 'access') || hasPermission(role, 'earnings', 'access')) {
    kpiRow.push({ id: 'kpi-revenue', config: { period: 'Today' } })
  }

  // 2. Build Quick Actions based on permissions
  if (hasPermission(role, 'stations', 'access')) {
    actions.push({ label: 'Manage Stations', path: '/stations', variant: 'primary' })
  }
  if (hasPermission(role, 'sessions', 'access')) {
    actions.push({ label: 'View Sessions', path: '/sessions', variant: 'secondary' })
  }
  if (hasPermission(role, 'incidents', 'create')) {
    actions.push({ label: 'Report Incident', path: '/incidents', variant: 'secondary' })
  }
  if (hasPermission(role, 'team', 'access')) {
    actions.push({ label: 'Manage Team', path: '/team', variant: 'secondary' })
  }
  if (hasPermission(role, 'reports', 'access')) {
    actions.push({ label: 'View Reports', path: '/reports', variant: 'secondary' })
  }
  if (hasPermission(role, 'billing', 'access')) {
    actions.push({ label: 'Billing & Wallet', path: '/billing', variant: 'secondary' })
  }

  // 3. Build Content Widgets
  const analyticsWidgets: any[] = []

  // Revenue / Analytics
  if (hasPermission(role, 'earnings', 'access')) {
    analyticsWidgets.push({ id: 'panel-revenue-chart', size: '2', config: { title: 'Revenue Trends' } })
  }
  if (hasPermission(role, 'stations', 'access')) {
    analyticsWidgets.push({ id: 'panel-utilization-heatmap', size: '2', config: { title: 'Utilization' } })
  }

  // Lists
  const listWidgets: any[] = []
  if (hasPermission(role, 'incidents', 'access')) {
    listWidgets.push({ id: 'list-incidents', size: '2', config: { title: 'Recent Incidents' } })
  }
  if (hasPermission(role, 'techRequests', 'access')) {
    listWidgets.push({ id: 'list-dispatch', size: '2', config: { title: 'Tech Requests' } })
  }

  // Assemble Rows
  const rows: any[] = []

  // Quick Actions Row
  if (actions.length > 0) {
    rows.push({
      sectionTitle: 'Quick Actions',
      widgets: [{
        id: 'panel-quick-actions',
        size: 'full',
        config: { title: 'Quick Actions', actions }
      }]
    })
  }

  // Analytics Row
  if (analyticsWidgets.length > 0) {
    rows.push({
      sectionTitle: 'Analytics',
      widgets: analyticsWidgets
    })
  }

  // Lists Row
  if (listWidgets.length > 0) {
    rows.push({
      sectionTitle: 'Operational Monitoring',
      widgets: listWidgets
    })
  }

  // If dashboard is empty, show generic fallback widgets
  if (kpiRow.length === 0 && rows.length === 0) {
    return GENERIC_DASHBOARD
  }

  return {
    title: 'Overview',
    kpiRow,
    rows
  }
}

