import { Card } from '@/ui/components/Card'
import { useNavigate } from 'react-router-dom'
import { useOwnerDashboardData } from '@/modules/analytics/hooks/useOwnerDashboardData'

function severityClass(severity: string) {
  if (severity === 'critical') return 'pill rejected'
  if (severity === 'high') return 'pill sendback'
  if (severity === 'medium') return 'pill pending'
  return 'bg-muted/20 text-muted border border-border-light rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase'
}

export function OwnerAlertsWidget() {
  const navigate = useNavigate()
  const { data } = useOwnerDashboardData()
  if (!data) return null

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-text">Action Panel</h3>
        <p className="text-sm text-text-secondary">What needs action today</p>
      </div>

      <div className="space-y-3">
        {data.alerts.length === 0 ? (
          <div className="text-sm text-text-secondary">No urgent actions for the current scope.</div>
        ) : (
          data.alerts.map((alert, index) => (
            <button
              key={`${alert.reasonCode}-${index}`}
              type="button"
              onClick={() => navigate(alert.recommendedPath)}
              className="w-full rounded-lg border border-border-light bg-panel p-4 text-left transition-colors hover:border-accent/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-text">{alert.message}</div>
                  <div className="mt-1 text-xs text-text-secondary">{alert.reasonCode.replaceAll('_', ' ')}</div>
                </div>
                <span className={severityClass(alert.severity)}>{alert.severity}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  )
}
