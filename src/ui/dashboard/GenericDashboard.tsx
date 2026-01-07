import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getDashboardConfig } from './dashboardConfigs'
import { Widget } from './WidgetRenderer'
import type { DashboardKey, DashboardRowConfig } from './types'
import { useScopeStore } from '@/core/scope/scopeStore'

/**
 * Fallback component when no dashboard is configured for the role
 */
function NoDashboardFallback() {
  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-xl font-semibold text-text mb-2">Dashboard Not Configured</h2>
        <p className="text-muted max-w-md">
          No dashboard configuration found for your role. Please contact your administrator.
        </p>
      </div>
    </DashboardLayout>
  )
}

/**
 * Renders a row of widgets with optional section title
 */
function RowRenderer({ row, index }: { row: DashboardRowConfig; index: number }) {
  const { scope } = useScopeStore()
  return (
    <>
      {row.sectionTitle && (
        <div className="text-xs text-muted font-semibold uppercase tracking-[0.5px] mb-3 mt-2">
          {row.sectionTitle}
        </div>
      )}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${index > 0 ? 'mt-4' : ''}`}>
        {row.widgets.map((w, i) => (
          <Widget key={`${w.id}-${i}`} widgetId={w.id} size={w.size} config={w.config} scope={scope} />
        ))}
      </div>
    </>
  )
}

/**
 * Generic Dashboard Component
 * 
 * Renders a dashboard based on the current user's role and the configuration
 * defined in dashboardConfigs.ts. Widgets are automatically filtered based
 * on RBAC permissions defined in the widget registry.
 * 
 * Usage:
 * - Simply render <GenericDashboard /> and it will automatically:
 *   1. Get the current user's role from authStore
 *   2. Look up the dashboard config for that role
 *   3. Render the configured widgets (with RBAC filtering)
 */
export function GenericDashboard() {
  const { user } = useAuthStore()
  const { scope } = useScopeStore()

  // No user = no dashboard
  if (!user) {
    return <NoDashboardFallback />
  }

  // Get the dashboard config for this role
  const config = getDashboardConfig(user.role as DashboardKey, user.ownerCapability)

  if (!config) {
    return <NoDashboardFallback />
  }

  return (
    <DashboardLayout pageTitle={config.title}>
      {/* KPI Row */}
      {config.kpiRow.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {config.kpiRow.map((w, i) => (
            <Widget key={`kpi-${w.id}-${i}`} widgetId={w.id} size="1" config={w.config} scope={scope} />
          ))}
        </div>
      )}

      {/* Spacer between KPI and content rows */}
      {config.kpiRow.length > 0 && config.rows.length > 0 && <div className="h-4" />}

      {/* Content Rows */}
      {config.rows.map((row, i) => (
        <RowRenderer key={i} row={row} index={i} />
      ))}
    </DashboardLayout>
  )
}

/**
 * Dashboard component with explicit role override
 * Useful for previewing dashboards or admin impersonation
 */
export function DashboardForRole({
  role,
  ownerCapability,
}: {
  role: DashboardKey
  ownerCapability?: 'CHARGE' | 'SWAP' | 'BOTH'
}) {
  const { scope } = useScopeStore()
  const config = getDashboardConfig(role, ownerCapability)

  if (!config) {
    return <NoDashboardFallback />
  }

  return (
    <DashboardLayout pageTitle={config.title}>
      {config.kpiRow.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {config.kpiRow.map((w, i) => (
            <Widget key={`kpi-${w.id}-${i}`} widgetId={w.id} size="1" config={w.config} scope={scope} />
          ))}
        </div>
      )}

      {config.kpiRow.length > 0 && config.rows.length > 0 && <div className="h-4" />}

      {config.rows.map((row, i) => (
        <RowRenderer key={i} row={row} index={i} />
      ))}
    </DashboardLayout>
  )
}

