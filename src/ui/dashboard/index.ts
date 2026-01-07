// Types
export * from './types'

// Widget Registry
export { WIDGET_REGISTRY, getWidget, canAccessWidget, getWidgetsForRole } from './widgetRegistry'

// Widget Renderer
export { Widget, WidgetRow } from './WidgetRenderer'

// Dashboard Configs
export { DASHBOARD_CONFIGS, getDashboardConfig } from './dashboardConfigs'

// Generic Dashboard
export { GenericDashboard, DashboardForRole } from './GenericDashboard'

// Re-export all widgets for direct use
export * from './widgets'

