import type { Role } from '@/core/auth/types'
import type { WidgetDef, WidgetId } from './types'

// KPI Widgets
import { KpiGenericWidget, KpiSimpleWidget, KpiStationsWidget, KpiRevenueWidget, KpiSessionsWidget, KpiIncidentsWidget, KpiUptimeWidget, KpiUtilizationWidget } from './widgets/kpi'

// Chart Widgets
import { BarChartWidget, LineChartWidget, DonutGaugeWidget } from './widgets/charts'

// List Widgets
import { IncidentsListWidget, DispatchQueueWidget, ApprovalsQueueWidget, AuditFeedWidget } from './widgets/lists'

// Map Widgets
import { WorldMapWidget } from './widgets/maps'

// Panel Widgets
import {
  AlertsPanelWidget,
  SystemHealthWidget,
  SettlementPanelWidget,
  PlaceholderWidget,
  PerformanceTableWidget,
  StationStatusTableWidget,
  ShiftBoardWidget,
  ActiveSessionsConsoleWidget,
  ChecklistWidget,
  StationAssignmentWidget,
  BookingsQueueWidget,
  ChargeStartWidget,
  SwapWorkflowWidget,
  SitesTableWidget,
  ApplicationsTableWidget,
  ShiftHandoffWidget,
  QuickActionsWidget
} from './widgets/panels'

/** All roles for convenience */
const ALL_ROLES: Role[] = [
  'SUPER_ADMIN',
  'EVZONE_ADMIN',
  'EVZONE_OPERATOR',
  'SITE_OWNER',
  'OWNER',
  'STATION_ADMIN',
  'MANAGER',
  'ATTENDANT',
  'TECHNICIAN_ORG',
  'TECHNICIAN_PUBLIC',
]

/** Admin + Operator roles */
const ADMIN_OPS: Role[] = ['SUPER_ADMIN', 'EVZONE_ADMIN', 'EVZONE_OPERATOR']

/** Roles that manage stations */
const STATION_MANAGERS: Role[] = ['SUPER_ADMIN', 'EVZONE_ADMIN', 'EVZONE_OPERATOR', 'OWNER', 'STATION_ADMIN', 'MANAGER']

/** Roles that see incidents */
const INCIDENT_VIEWERS: Role[] = ['SUPER_ADMIN', 'EVZONE_ADMIN', 'EVZONE_OPERATOR', 'OWNER', 'STATION_ADMIN', 'MANAGER', 'TECHNICIAN_ORG']

/** Widget registry - all available widgets with RBAC */
export const WIDGET_REGISTRY: Record<WidgetId, WidgetDef> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // KPI WIDGETS
  // ═══════════════════════════════════════════════════════════════════════════

  'kpi-generic': {
    id: 'kpi-generic',
    title: 'Generic KPI',
    allowedRoles: ALL_ROLES,
    component: KpiGenericWidget as any,
    defaultSize: '1',
    category: 'kpi',
  },

  'kpi-simple': {
    id: 'kpi-simple',
    title: 'Simple KPI',
    allowedRoles: ALL_ROLES,
    component: KpiSimpleWidget as any,
    defaultSize: '1',
    category: 'kpi',
  },

  'kpi-stations': {
    id: 'kpi-stations',
    title: 'Stations',
    allowedRoles: STATION_MANAGERS,
    component: KpiStationsWidget,
    defaultSize: '1',
    category: 'kpi',
  },

  'kpi-revenue': {
    id: 'kpi-revenue',
    title: 'Revenue',
    allowedRoles: ['EVZONE_ADMIN', 'EVZONE_OPERATOR', 'OWNER', 'SITE_OWNER'],
    component: KpiRevenueWidget as any,
    defaultSize: '1',
    category: 'kpi',
  },

  'kpi-sessions': {
    id: 'kpi-sessions',
    title: 'Sessions',
    allowedRoles: STATION_MANAGERS.concat('ATTENDANT'),
    component: KpiSessionsWidget as any,
    defaultSize: '1',
    category: 'kpi',
  },

  'kpi-incidents': {
    id: 'kpi-incidents',
    title: 'Incidents',
    allowedRoles: INCIDENT_VIEWERS,
    component: KpiIncidentsWidget as any,
    defaultSize: '1',
    category: 'kpi',
  },

  'kpi-uptime': {
    id: 'kpi-uptime',
    title: 'Uptime / SLA',
    allowedRoles: STATION_MANAGERS,
    component: KpiUptimeWidget as any,
    defaultSize: '1',
    category: 'kpi',
  },

  'kpi-utilization': {
    id: 'kpi-utilization',
    title: 'Utilization',
    allowedRoles: STATION_MANAGERS,
    component: KpiUtilizationWidget as any,
    defaultSize: '1',
    category: 'kpi',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHART WIDGETS
  // ═══════════════════════════════════════════════════════════════════════════

  'chart-bar': {
    id: 'chart-bar',
    title: 'Bar Chart',
    allowedRoles: ALL_ROLES,
    component: BarChartWidget as any,
    defaultSize: '2',
    category: 'chart',
  },

  'chart-line': {
    id: 'chart-line',
    title: 'Line Chart',
    allowedRoles: ALL_ROLES,
    component: LineChartWidget as any,
    defaultSize: '2',
    category: 'chart',
  },

  'chart-donut': {
    id: 'chart-donut',
    title: 'Donut Gauge',
    allowedRoles: ALL_ROLES,
    component: DonutGaugeWidget as any,
    defaultSize: '2',
    category: 'chart',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST WIDGETS
  // ═══════════════════════════════════════════════════════════════════════════

  'list-incidents': {
    id: 'list-incidents',
    title: 'Incidents List',
    allowedRoles: INCIDENT_VIEWERS,
    component: IncidentsListWidget as any,
    defaultSize: '2',
    category: 'list',
  },

  'list-dispatch': {
    id: 'list-dispatch',
    title: 'Dispatch Queue',
    allowedRoles: ['EVZONE_ADMIN', 'EVZONE_OPERATOR', 'MANAGER', 'TECHNICIAN_ORG', 'TECHNICIAN_PUBLIC'],
    component: DispatchQueueWidget as any,
    defaultSize: '2',
    category: 'list',
  },

  'list-approvals': {
    id: 'list-approvals',
    title: 'Approvals Queue',
    allowedRoles: ADMIN_OPS,
    component: ApprovalsQueueWidget as any,
    defaultSize: '2',
    category: 'list',
  },

  'list-audit': {
    id: 'list-audit',
    title: 'Audit Feed',
    allowedRoles: ADMIN_OPS,
    component: AuditFeedWidget as any,
    defaultSize: '2',
    category: 'list',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP WIDGETS
  // ═══════════════════════════════════════════════════════════════════════════

  'map-world': {
    id: 'map-world',
    title: 'World Map',
    allowedRoles: ADMIN_OPS,
    component: WorldMapWidget as any,
    defaultSize: '3',
    category: 'map',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PANEL WIDGETS
  // ═══════════════════════════════════════════════════════════════════════════

  'panel-alerts': {
    id: 'panel-alerts',
    title: 'Alerts Panel',
    allowedRoles: ADMIN_OPS,
    component: AlertsPanelWidget as any,
    defaultSize: '1',
    category: 'panel',
  },

  'panel-health': {
    id: 'panel-health',
    title: 'System Health',
    allowedRoles: ADMIN_OPS,
    component: SystemHealthWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-settlement': {
    id: 'panel-settlement',
    title: 'Settlement Panel',
    allowedRoles: ['EVZONE_ADMIN', 'EVZONE_OPERATOR', 'OWNER', 'SITE_OWNER'],
    component: SettlementPanelWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-placeholder': {
    id: 'panel-placeholder',
    title: 'Placeholder',
    allowedRoles: ALL_ROLES,
    component: PlaceholderWidget as any,
    defaultSize: '1',
    category: 'panel',
  },

  'panel-performance': {
    id: 'panel-performance',
    title: 'Performance Table',
    allowedRoles: ADMIN_OPS,
    component: PerformanceTableWidget as any,
    defaultSize: 'full',
    category: 'panel',
  },

  'panel-stations-status': {
    id: 'panel-stations-status',
    title: 'My Stations Status',
    allowedRoles: STATION_MANAGERS,
    component: StationStatusTableWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-shift-board': {
    id: 'panel-shift-board',
    title: 'Shift Board',
    allowedRoles: ['EVZONE_ADMIN', 'EVZONE_OPERATOR', 'MANAGER'],
    component: ShiftBoardWidget as any,
    defaultSize: '1',
    category: 'panel',
  },

  'panel-sessions-console': {
    id: 'panel-sessions-console',
    title: 'Active Sessions Console',
    allowedRoles: ['EVZONE_ADMIN', 'EVZONE_OPERATOR', 'ATTENDANT'],
    component: ActiveSessionsConsoleWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-station-assignment': {
    id: 'panel-station-assignment',
    title: 'Assigned Station',
    allowedRoles: ['ATTENDANT'],
    component: StationAssignmentWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-bookings-queue': {
    id: 'panel-bookings-queue',
    title: 'Station Bookings',
    allowedRoles: ['ATTENDANT'],
    component: BookingsQueueWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-charge-start': {
    id: 'panel-charge-start',
    title: 'Start Charge Session',
    allowedRoles: ['ATTENDANT'],
    component: ChargeStartWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-swap-flow': {
    id: 'panel-swap-flow',
    title: 'Swap Workflow',
    allowedRoles: ['ATTENDANT'],
    component: SwapWorkflowWidget as any,
    defaultSize: 'full',
    category: 'panel',
  },

  'panel-checklist': {
    id: 'panel-checklist',
    title: 'Daily Checklist',
    allowedRoles: ['EVZONE_ADMIN', 'EVZONE_OPERATOR', 'ATTENDANT'],
    component: ChecklistWidget as any,
    defaultSize: '1',
    category: 'panel',
  },

  'panel-sites-table': {
    id: 'panel-sites-table',
    title: 'My Sites Table',
    allowedRoles: ['SITE_OWNER', 'EVZONE_ADMIN'],
    component: SitesTableWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-apps-table': {
    id: 'panel-apps-table',
    title: 'Applications Table',
    allowedRoles: ['SITE_OWNER', 'EVZONE_ADMIN'],
    component: ApplicationsTableWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-shift-handoff': {
    id: 'panel-shift-handoff',
    title: 'Shift Handoff',
    allowedRoles: ['EVZONE_OPERATOR', 'EVZONE_ADMIN'],
    component: ShiftHandoffWidget as any,
    defaultSize: '2',
    category: 'panel',
  },

  'panel-quick-actions': {
    id: 'panel-quick-actions',
    title: 'Quick Actions',
    allowedRoles: ALL_ROLES,
    component: QuickActionsWidget as any,
    defaultSize: 'full',
    category: 'panel',
  },
}

/** Get a widget definition by ID */
export function getWidget(id: WidgetId): WidgetDef | undefined {
  return WIDGET_REGISTRY[id]
}

/** Check if a role can access a widget */
export function canAccessWidget(widgetId: WidgetId, role: Role): boolean {
  const def = WIDGET_REGISTRY[widgetId]
  if (!def) return false
  if (role === 'SUPER_ADMIN') return true
  return def.allowedRoles.length === 0 || def.allowedRoles.includes(role)
}

/** Get all widgets accessible by a role */
export function getWidgetsForRole(role: Role): WidgetDef[] {
  if (role === 'SUPER_ADMIN') return Object.values(WIDGET_REGISTRY)
  return Object.values(WIDGET_REGISTRY).filter(
    (w) => w.allowedRoles.length === 0 || w.allowedRoles.includes(role)
  )
}

