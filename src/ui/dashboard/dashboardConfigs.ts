import type { DashboardConfig, DashboardKey } from './types'
import type { Role } from '@/core/auth/types'

import type { ChoroplethDatum } from '@/ui/components/WorldChoroplethMap'
import { hasPermission } from '@/constants/permissions'

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA - In production, this would come from API/stores
// ═══════════════════════════════════════════════════════════════════════════

const mockRegions = [
  { region: 'North America', uptime: 99.4, incidents: 12, stations: 540, revenueUsd: 1_240_000, sessions: 182_000 },
  { region: 'Europe', uptime: 99.1, incidents: 9, stations: 430, revenueUsd: 1_050_000, sessions: 154_000 },
  { region: 'Africa', uptime: 98.6, incidents: 14, stations: 210, revenueUsd: 460_000, sessions: 72_000 },
  { region: 'Asia', uptime: 99.2, incidents: 8, stations: 380, revenueUsd: 980_000, sessions: 141_000 },
  { region: 'Middle East', uptime: 98.9, incidents: 6, stations: 190, revenueUsd: 410_000, sessions: 61_000 },
]

const mockChoropleth: ChoroplethDatum[] = [
  { id: 'N_AMERICA', label: 'North America', metrics: { stations: 540, sessions: 182000, uptime: 99.4, revenueUsd: 1240000 } },
  { id: 'EUROPE', label: 'Europe', metrics: { stations: 430, sessions: 154000, uptime: 99.1, revenueUsd: 1050000 } },
  { id: 'AFRICA', label: 'Africa', metrics: { stations: 210, sessions: 72000, uptime: 98.6, revenueUsd: 460000 } },
  { id: 'ASIA', label: 'Asia', metrics: { stations: 380, sessions: 141000, uptime: 99.2, revenueUsd: 980000 } },
  { id: 'MIDDLE_EAST', label: 'Middle East', metrics: { stations: 190, sessions: 61000, uptime: 98.9, revenueUsd: 410000 } },
]

const mockIncidents = [
  { id: 'INC-2401', title: 'Grid instability - Lagos', sev: 'SEV1' as const, owner: 'Ops West', eta: '45m', sla: '01:12' },
  { id: 'INC-2389', title: 'OCPP drop - Berlin hub', sev: 'SEV2' as const, owner: 'Ops EU', eta: '1h20', sla: '02:05' },
  { id: 'INC-2377', title: 'Battery recall flag', sev: 'SEV3' as const, owner: 'Safety', eta: '—', sla: '06:30' },
]

const mockDispatches = [
  { id: 'DSP-8832', job: 'Swap stack recal', region: 'NA', tech: 'Crew A', eta: '32m', priority: 'P1' as const },
  { id: 'DSP-8821', job: 'Charger RCD check', region: 'EU', tech: 'Crew D', eta: '1h05', priority: 'P2' as const },
  { id: 'DSP-8810', job: 'Locker door fault', region: 'AF', tech: 'Partner-X', eta: '1h30', priority: 'P3' as const },
]

const mockApprovals = [
  { id: 'KYC-204', type: 'Owner KYC', owner: 'Volt Mobility', age: '2d', status: 'Review' as const },
  { id: 'ACR-118', type: 'Access review', owner: 'Ops EU', age: '1d', status: 'Pending' as const },
  { id: 'KYC-199', type: 'Technician vetting', owner: 'Contractor-Z', age: '4d', status: 'Blocked' as const },
]

const mockHealth = [
  { service: 'Core API', status: 'Operational' as const, p95: 182, errors: 0.08, backlog: 3 },
  { service: 'OCPP Broker', status: 'Degraded' as const, p95: 420, errors: 0.42, backlog: 28 },
  { service: 'Webhooks', status: 'Operational' as const, p95: 210, errors: 0.11, backlog: 7 },
  { service: 'OCPI Sync', status: 'Operational' as const, p95: 260, errors: 0.05, backlog: 2 },
]

const mockPaymentIssues = [
  { id: 'PAY-771', provider: 'Stripe', type: 'Card auth fail spike', amount: 18240, status: 'Retrying' as const },
  { id: 'PAY-766', provider: 'Flutterwave', type: 'Reconciliation gap', amount: 9210, status: 'Open' as const },
]

const mockAuditEvents = [
  { id: 'AUD-9921', actor: 'd.admin', action: 'Impersonated owner', scope: 'OWNER-442', when: '06m ago' },
  { id: 'AUD-9917', actor: 'c.sre', action: 'API key rotated', scope: 'Platform', when: '19m ago' },
  { id: 'AUD-9909', actor: 'b.billing', action: 'Exported ledger', scope: 'Region=EU', when: '42m ago' },
]

const mockStationsStatus = [
  { id: 'ST-001', name: 'Downtown Hub A', location: 'Commercial St 12', status: 'online' as const, occupancy: 85, activeSessions: 6, lastPulse: '2m ago' },
  { id: 'ST-002', name: 'Westside Supercharge', location: 'Highway Exit 4', status: 'warning' as const, occupancy: 40, activeSessions: 2, lastPulse: '5m ago' },
  { id: 'ST-003', name: 'Airport Express', location: 'Terminal 2 P4', status: 'online' as const, occupancy: 10, activeSessions: 1, lastPulse: '1m ago' },
]

const mockStaffMembers = [
  { id: 'USR-101', name: 'Sarah Chen', role: 'Lead Attendant', status: 'active' as const, assignment: 'Downtown Hub' },
  { id: 'USR-102', name: 'Marcus Miller', role: 'Attendant', status: 'active' as const, assignment: 'Downtown Hub' },
  { id: 'USR-103', name: 'Elena Rodriguez', role: 'Attendant', status: 'break' as const, assignment: 'Westside' },
  { id: 'USR-104', name: 'Jordan Smith', role: 'Senior Tech', status: 'offline' as const, assignment: 'On Call' },
]

const mockActiveSessions = [
  { id: 'SES-991', bay: 'A1', user: 'Tesla Mod 3', carModel: 'White (K-8821)', soc: 72, startTime: '12:45', powerKw: 120, cost: 14.20, status: 'charging' as const },
  { id: 'SES-992', bay: 'A2', user: 'Rivian R1T', carModel: 'Blue (B-9912)', soc: 45, startTime: '13:10', powerKw: 150, cost: 8.50, status: 'charging' as const },
  { id: 'SES-993', bay: 'B1', user: 'Ford F-150', carModel: 'Grey (F-2204)', soc: 92, startTime: '11:30', powerKw: 45, cost: 32.10, status: 'finishing' as const },
]

const mockAttendantStation = {
  id: 'ST-001',
  name: 'Central Hub',
  location: 'Kampala - Main Ave',
  status: 'online' as const,
  capability: 'Both' as const,
  shift: '08:00 - 16:00',
  attendant: 'Alex Kato',
}

const mockAttendantMetrics = [
  { label: 'Chargers available', value: '4 / 12', tone: 'ok' as const },
  { label: 'Swap docks open', value: '3 / 10', tone: 'warn' as const },
  { label: 'Queue', value: '3 waiting', tone: 'warn' as const },
  { label: 'Last sync', value: '2m ago', tone: 'ok' as const },
]

const mockAttendantBookings = [
  { id: 'BK-1102', customer: 'Amina K', service: 'Charge' as const, time: '14:00', bay: 'Bay 3', status: 'Confirmed' as const },
  { id: 'BK-1106', customer: 'Daniel M', service: 'Swap' as const, time: '14:20', bay: 'Dock 2', status: 'Pending' as const },
  { id: 'BK-1107', customer: 'Grace N', service: 'Charge' as const, time: '14:45', bay: 'Bay 1', status: 'Confirmed' as const },
  { id: 'BK-1109', customer: 'Joseph S', service: 'Swap' as const, time: '15:10', bay: 'Dock 4', status: 'Completed' as const },
]

const mockChargeScans = [
  { chargerId: 'CP-A1', rfid: 'RF-2188', time: '2m ago', status: 'ready' as const },
  { chargerId: 'CP-A4', rfid: 'RF-2196', time: '11m ago', status: 'started' as const },
]

const mockSwapWorkflow = {
  title: 'Swap workflow',
  subtitle: 'Scan batteries, assign docks, confirm payment',
  steps: [
    { id: 'swap-1', label: 'Scan returned battery', detail: 'BAT-1049', status: 'done' as const },
    { id: 'swap-2', label: 'Check power and energy', detail: 'SOC 23% - 1.2 kWh', status: 'done' as const },
    { id: 'swap-3', label: 'Assign return dock', detail: 'Dock R-07', status: 'done' as const },
    { id: 'swap-4', label: 'Assign charged dock', detail: 'Dock C-12', status: 'active' as const },
    { id: 'swap-5', label: 'Scan charged battery', detail: 'Waiting for scan', status: 'pending' as const },
    { id: 'swap-6', label: 'Calculate amount and confirm payment', detail: 'UGX 9,200', status: 'pending' as const },
  ],
  returnedBattery: { id: 'BAT-1049', soc: 23, energyKwh: 1.2, dock: 'R-07' },
  chargedBattery: { id: 'BAT-1107', soc: 98, energyKwh: 4.8, dock: 'C-12' },
  payment: { amount: 9200, currency: 'UGX', method: 'Cash', status: 'pending' as const },
}

const mockSites = [
  { id: 'st-401', name: 'Business Park A', city: 'Wuxi', status: 'Active', bays: 14, power: 150, updated: '2025-10-20 11:45' },
  { id: 'st-402', name: 'City Mall Roof', city: 'Kampala', status: 'Approved', bays: 25, power: 250, updated: '2025-10-19 16:10' },
  { id: 'st-403', name: 'Airport Long-Stay', city: 'Nairobi', status: 'Pending', bays: 30, power: 300, updated: '2025-10-18 09:30' },
]

const mockApps = [
  { id: 'APP-2201', site: 'Airport Long‑Stay', model: 'Revenue share', terms: '12%', status: 'Under Review', date: '2025-10-18' },
  { id: 'APP-2200', site: 'Warehouse West', model: 'Fixed rent', terms: '$500/mo', status: 'Applied', date: '2025-10-12' },
  { id: 'APP-2199', site: 'Tech Campus', model: 'Hybrid', terms: '8% + $200/mo', status: 'Approved', date: '2025-10-05' },
]

const mockOperatorContext = {
  initialNotes: 'Night shift reported minor OCPP instability on CP-B4. Grid voltage stable.',
}

const GENERIC_DASHBOARD: DashboardConfig = {
  title: 'Dashboard',
  kpiRow: [
    { id: 'kpi-generic', config: { title: 'Assigned Items', value: '—' } },
    { id: 'kpi-generic', config: { title: 'Open Tasks', value: '—' } },
    { id: 'kpi-generic', config: { title: 'Recent Alerts', value: '0' } },
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
    { id: 'kpi-stations', config: { total: 1316, online: 1284, offline: 32, variant: 'total' } },
    { id: 'kpi-stations', config: { total: 1316, online: 1284, variant: 'online' } },
    { id: 'kpi-incidents', config: { count: 47, period: '24h' } },
    { id: 'kpi-stations', config: { offline: 32, variant: 'offline' } },
  ],
  rows: [
    {
      sectionTitle: 'Global Operations',
      widgets: [
        { id: 'map-world', size: '3', config: { title: 'Live Hotspots', subtitle: 'Regional metrics by station density', data: mockChoropleth } },
        {
          id: 'panel-alerts', size: '1', config: {
            title: 'Vulnerabilities & Alerts', metrics: [
              { label: 'Critical', value: 3, max: 20, color: '#ef4444' },
              { label: 'High', value: 12, max: 50, color: '#f59e0b' },
              { label: 'Medium', value: 28, max: 100, color: '#f77f00' },
            ]
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
            title: 'Exchange & Settlement', issues: mockPaymentIssues, exports: [
              { label: 'Ledger export (EU)', status: 'queued', when: '3m ago' },
              { label: 'Disputes aging', status: 'running', when: '11m ago' },
            ]
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
      { id: 'kpi-uptime', config: { value: 99.1 } },
      { id: 'kpi-stations', config: { offline: 16, variant: 'offline' } },
      { id: 'kpi-generic', config: { title: 'Approvals pending', value: '36' } },
      { id: 'kpi-sessions', config: { count: 4208, period: 'Today' } },
    ],
    rows: [
      {
        sectionTitle: 'Stations & Incidents',
        widgets: [
          { id: 'map-world', size: '2', config: { title: 'Regional Map', subtitle: 'Online/offline by region', data: mockChoropleth } },
          { id: 'list-incidents', size: '2', config: { title: 'Top Incidents' } },
        ],
      },
      {
        sectionTitle: 'Handoff & Ops',
        widgets: [
          { id: 'panel-shift-handoff', size: 'full', config: mockOperatorContext },
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
          { id: 'panel-settlement', size: '2', config: { title: 'Settlement Exceptions', issues: mockPaymentIssues } },
        ],
      },
    ],
  },



  // ─────────────────────────────────────────────────────────────────────────
  // SITE OWNER DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
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
          { id: 'chart-line', size: '2', config: { title: 'Earnings trend', values: [5200, 5400, 5800, 6100, 6240], stroke: '#03cd8c' } },
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
      { id: 'kpi-uptime', config: { value: 98.8, trend: 'up' } },
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
      { id: 'kpi-stations', config: { total: 8, online: 7, variant: 'online' } },
      { id: 'kpi-sessions', config: { count: 142, period: 'Today' } },
      { id: 'kpi-incidents', config: { count: 3, period: 'Open' } },
      { id: 'kpi-utilization', config: { value: 72 } },
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
          { id: 'chart-bar', size: '2', config: { title: 'Daily Sessions', values: [98, 124, 112, 138], color: '#f77f00', labels: ['Mon', 'Tue', 'Wed', 'Thu'] } },
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
      { id: 'kpi-stations', config: { total: 4, online: 4, variant: 'online' } },
      { id: 'kpi-revenue', config: { amount: 1240, period: 'Today', trend: 'up', delta: '+12% vs avg' } },
      { id: 'kpi-sessions', config: { count: 287, period: 'Today' } },
      { id: 'kpi-uptime', config: { value: 98.7, trend: 'up', delta: '+0.3% vs last week' } },
    ],
    rows: [
      {
        sectionTitle: 'Quick Actions & Network',
        widgets: [
          { id: 'map-world', size: '2', config: { title: 'Regional Map', subtitle: 'Station metrics', data: mockChoropleth } },
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
          { id: 'chart-bar', size: '2', config: { title: 'Daily Sessions', values: [145, 178, 162, 198, 187, 210, 287], color: '#f77f00', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] } },
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
      { id: 'kpi-generic', config: { title: 'Assigned stations', value: '3' } },
      { id: 'kpi-generic', config: { title: 'Staff on shift', value: '7' } },
      { id: 'kpi-incidents', config: { count: 3, period: 'Open' } },
      { id: 'kpi-generic', config: { title: 'CSAT (7d)', value: '4.6 / 5', trend: 'up' } },
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
          { id: 'panel-shift-board', size: '2', config: { staff: mockStaffMembers } },
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
      { id: 'kpi-generic', config: { title: 'Assigned station', value: `${mockAttendantStation.name} (${mockAttendantStation.id})` } },
      { id: 'kpi-generic', config: { title: 'Charges today', value: '24', trend: 'up', delta: '+4 vs yesterday' } },
      { id: 'kpi-generic', config: { title: 'Swaps today', value: '18', trend: 'up', delta: '+2 vs yesterday' } },
      { id: 'kpi-generic', config: { title: 'Bookings today', value: String(mockAttendantBookings.length) } },
    ],
    rows: [
      {
        sectionTitle: 'Station Overview',
        widgets: [
          { id: 'panel-station-assignment', size: '2', config: { station: mockAttendantStation, metrics: mockAttendantMetrics } },
          { id: 'panel-bookings-queue', size: '2', config: { stationName: mockAttendantStation.name } },
        ],
      },
      {
        sectionTitle: 'Charging Operations',
        widgets: [
          { id: 'panel-sessions-console', size: '2', config: { title: 'Live charging sessions', subtitle: 'Active bays for assigned station' } },
          { id: 'panel-charge-start', size: '2', config: { tips: ['Verify connector', 'Assign bay', 'Confirm rate'], recentScans: mockChargeScans } },
        ],
      },
      {
        sectionTitle: 'Swap Operations',
        widgets: [
          { id: 'panel-swap-flow', size: 'full', config: mockSwapWorkflow },
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
      { id: 'kpi-generic', config: { title: 'Jobs open', value: '6' } },
      { id: 'kpi-generic', config: { title: 'Due today', value: '2', trend: 'down' } },
      { id: 'kpi-generic', config: { title: 'SLA at risk', value: '1' } },
      { id: 'kpi-generic', config: { title: 'First-time fix', value: '86%', trend: 'up' } },
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
      { id: 'kpi-generic', config: { title: 'Available jobs', value: '12' } },
      { id: 'kpi-generic', config: { title: 'My active', value: '1' } },
      { id: 'kpi-generic', config: { title: 'Completed (30d)', value: '18' } },
      { id: 'kpi-generic', config: { title: 'Rating', value: '4.8 / 5', trend: 'up' } },
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
      { id: 'kpi-generic', config: { title: 'Transactions today', value: '42' } },
      { id: 'kpi-generic', config: { title: 'Collections', value: '$840.00' } },
      { id: 'kpi-generic', config: { title: 'Pending', value: '3' } },
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
    kpiRow.push({ id: 'kpi-stations', config: { total: '-', online: '-', variant: 'online' } })
  }
  if (hasPermission(role, 'sessions', 'access')) {
    kpiRow.push({ id: 'kpi-sessions', config: { count: '-', period: 'Today' } })
  }
  if (hasPermission(role, 'incidents', 'access')) {
    kpiRow.push({ id: 'kpi-incidents', config: { count: '-', period: 'Open' } })
  }
  if (hasPermission(role, 'billing', 'access') || hasPermission(role, 'earnings', 'access')) {
    kpiRow.push({ id: 'kpi-revenue', config: { amount: '-', period: 'Today' } })
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

