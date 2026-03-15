import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getDashboardConfig } from './dashboardConfigs'
import { Widget } from './WidgetRenderer'
import type { DashboardKey, DashboardRowConfig } from './types'
import { useScopeStore } from '@/core/scope/scopeStore'
import { useOwnerDashboardData } from '@/modules/analytics/hooks/useOwnerDashboardData'
import Skeleton from 'react-loading-skeleton'

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

function OwnerDashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border-light bg-panel shadow-card p-4">
            <Skeleton height={12} width="55%" />
            <div className="mt-3">
              <Skeleton height={28} width="70%" />
            </div>
            <div className="mt-2">
              <Skeleton height={10} width="60%" />
            </div>
          </div>
        ))}
      </div>

      <div className="h-4" />

      <div className="space-y-4">
        <div>
          <div className="mb-3 mt-2 text-xs font-semibold uppercase tracking-[0.5px] text-muted">Filters</div>
          <div className="rounded-lg border border-border-light bg-panel shadow-card p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <Skeleton height={12} width="30%" />
                  <div className="mt-2">
                    <Skeleton height={40} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 mt-2 text-xs font-semibold uppercase tracking-[0.5px] text-muted">Commercial + Operations</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border-light bg-panel shadow-card p-6 md:col-span-1 lg:col-span-2">
              <Skeleton height={22} width="40%" />
              <div className="mt-2">
                <Skeleton height={12} width="50%" />
              </div>
              <div className="mt-6">
                <Skeleton height={300} />
              </div>
            </div>
            <div className="rounded-lg border border-border-light bg-panel shadow-card p-6 md:col-span-1 lg:col-span-2">
              <Skeleton height={22} width="45%" />
              <div className="mt-2">
                <Skeleton height={12} width="55%" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} height={64} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function OwnerDashboardContent({ config }: { config: NonNullable<ReturnType<typeof getDashboardConfig>> }) {
  const { scope } = useScopeStore()
  const ownerDashboard = useOwnerDashboardData()
  const showInitialSkeleton = ownerDashboard.isLoading && !ownerDashboard.data
  const showRefreshingOverlay = ownerDashboard.isFetching && !showInitialSkeleton

  if (showInitialSkeleton) {
    return <OwnerDashboardSkeleton />
  }

  return (
    <div className="relative">
      {showRefreshingOverlay && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-white/45 backdrop-blur-[1px]">
          <div className="sticky top-4 mx-auto flex w-fit items-center gap-2 rounded-full border border-border-light bg-panel/95 px-3 py-2 shadow-card">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
            <span className="text-sm font-medium text-text">Updating dashboard…</span>
          </div>
        </div>
      )}

      {config.kpiRow.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {config.kpiRow.map((w, i) => (
            <Widget key={`kpi-${w.id}-${i}`} widgetId={w.id} size="1" config={w.config} scope={scope} />
          ))}
        </div>
      )}

      {config.kpiRow.length > 0 && config.rows.length > 0 && <div className="h-4" />}

      {config.rows.map((row, i) => (
        <RowRenderer key={i} row={row} index={i} />
      ))}
    </div>
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
      {user.role === 'STATION_OWNER' ? (
        <OwnerDashboardContent config={config} />
      ) : (
        <>
          {/* KPI Row */}
          {config.kpiRow.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
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
        </>
      )}
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
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
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

