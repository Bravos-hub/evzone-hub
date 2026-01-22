import { Card } from '@/ui/components/Card'
import type { TenantSiteSummary } from '../types/tenant'
import type { User } from '@/core/api/types'

type DelegatedViewProps = {
  site: TenantSiteSummary
  operator?: User | null
}

export function DelegatedView({ site, operator }: DelegatedViewProps) {
  const expectedRevenue = site.revenue
  const reportedRevenue = Math.round(expectedRevenue * 0.94)
  const variance = expectedRevenue - reportedRevenue
  const varianceLabel = variance >= 0 ? `+$${variance.toLocaleString()}` : `-$${Math.abs(variance).toLocaleString()}`
  const revenueProgress = expectedRevenue > 0 ? Math.min(100, (reportedRevenue / expectedRevenue) * 100) : 0

  const slaCompliance = Math.min(100, Math.round(site.uptime + 1.5))
  const rating = Math.min(5, Math.max(3.5, Number((site.uptime / 20).toFixed(1))))

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted font-semibold">Operator Performance</div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-lg font-bold text-ok">{site.uptime}%</div>
            <div className="text-[11px] text-muted">Uptime</div>
          </div>
          <div>
            <div className="text-lg font-bold">{slaCompliance}%</div>
            <div className="text-[11px] text-muted">SLA Compliance</div>
          </div>
          <div>
            <div className="text-lg font-bold">{rating}</div>
            <div className="text-[11px] text-muted">Rating</div>
          </div>
          <div>
            <div className="text-lg font-bold">{site.sessions}</div>
            <div className="text-[11px] text-muted">Sessions</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted font-semibold">Revenue Audit</div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Expected</span>
            <span className="font-semibold">${expectedRevenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Reported</span>
            <span className="font-semibold">${reportedRevenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Variance</span>
            <span className={variance >= 0 ? 'text-ok font-semibold' : 'text-warn font-semibold'}>
              {varianceLabel}
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted/30 overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${revenueProgress}%` }} />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted font-semibold">Operator Info</div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="font-semibold">{operator?.name || site.operatorName || 'Assigned Operator'}</div>
          <div className="text-xs text-muted">{operator?.email || 'Contact email unavailable'}</div>
          <div className="text-xs text-muted">Contract: {site.leaseStatus}</div>
          <div className="text-xs text-muted">
            Model: {site.isDelegated ? 'Delegated Operations' : 'Self-Managed'}
          </div>
        </div>
      </Card>
    </div>
  )
}
