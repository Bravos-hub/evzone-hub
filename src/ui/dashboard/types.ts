import type { Role, OwnerCapability, Scope } from '@/core/auth/types'
import type { ComponentType } from 'react'

/** Unique identifier for a widget (e.g. 'kpi-stations', 'world-map') */
export type WidgetId = string

/** Grid column span for widget sizing */
export type WidgetSize = '1' | '2' | '3' | '4' | 'full'

/** Widget category for grouping and styling */
export type WidgetCategory = 'kpi' | 'chart' | 'list' | 'map' | 'panel'

/** Props passed to every widget component */
export type WidgetProps<T = Record<string, unknown>> = {
  config?: T
}

/** Widget definition in the registry */
export type WidgetDef = {
  id: WidgetId
  title: string
  /** Roles that can see this widget - empty array means all roles */
  allowedRoles: Role[]
  /** Optional: restrict to specific owner capabilities (CHARGE, SWAP, BOTH) */
  ownerCapabilities?: OwnerCapability[]
  component: ComponentType<WidgetProps>
  defaultSize: WidgetSize
  category: WidgetCategory
}

/** Widget instance in a dashboard row */
export type WidgetInstance = {
  id: WidgetId
  size?: WidgetSize
  config?: Record<string, unknown>
}

/** A row of widgets in a dashboard */
export type DashboardRowConfig = {
  widgets: WidgetInstance[]
  /** Optional section title above this row */
  sectionTitle?: string
}

/** Full dashboard configuration for a role */
export type DashboardConfig = {
  title: string
  /** Top KPI row widgets */
  kpiRow: WidgetInstance[]
  /** Content rows below KPIs */
  rows: DashboardRowConfig[]
}

/** Role-specific dashboard key (handles OWNER sub-types) */
export type DashboardKey = Role | 'OWNER_CHARGE' | 'OWNER_SWAP' | 'OWNER_BOTH'

/** Scope passed to widgets for filtering */
export type WidgetScope = Scope

