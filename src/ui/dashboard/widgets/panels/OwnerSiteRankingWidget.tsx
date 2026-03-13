import { Card } from '@/ui/components/Card'
import { useOwnerDashboardData } from '@/modules/analytics/hooks/useOwnerDashboardData'
import type { WidgetProps } from '../../types'

export type OwnerSiteRankingConfig = {
  variant: 'top' | 'bottom'
  title?: string
}

export function OwnerSiteRankingWidget({ config }: WidgetProps<OwnerSiteRankingConfig>) {
  const { data } = useOwnerDashboardData()
  if (!data) return null

  const variant = config?.variant ?? 'top'
  const rows = variant === 'top' ? data.utilization.topSites : data.utilization.underperformingSites
  const title = config?.title ?? (variant === 'top' ? 'Top Performing Stations' : 'Underperforming Stations')

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-text">{title}</h3>
        <p className="text-sm text-text-secondary">
          {variant === 'top' ? 'Best revenue and utilization performers' : 'Lowest-performing stations that may need action'}
        </p>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="text-sm text-text-secondary">No stations in scope.</div>
        ) : (
          rows.map((row) => (
            <div key={row.stationId} className="rounded-lg border border-border-light bg-panel p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-text">{row.stationName}</div>
                  <div className="text-xs text-text-secondary">{row.siteName || 'Unassigned site'}</div>
                </div>
                <div className="text-right text-xs text-text-secondary">
                  <div>{row.utilizationPct.toFixed(1)}% util</div>
                  <div>{row.sessions} sessions</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-text-secondary">
                <div>Revenue: <span className="text-text font-medium">${row.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                <div>Uptime: <span className="text-text font-medium">{row.uptimePct == null ? 'N/A' : `${row.uptimePct.toFixed(1)}%`}</span></div>
                <div>Margin: <span className="text-text font-medium">{row.margin == null ? 'N/A' : `$${row.margin.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
