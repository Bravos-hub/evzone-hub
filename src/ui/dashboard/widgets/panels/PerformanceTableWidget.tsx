import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { MiniBar } from '../charts/MiniBarWidget'

export type RegionPerformance = {
  region: string
  uptime: number
  incidents: number
  revenue: number
  sessions: number
  capacity?: number
}

export type PerformanceTableConfig = {
  title?: string
  subtitle?: string
  regions: RegionPerformance[]
}

export function PerformanceTableWidget({ config }: WidgetProps<PerformanceTableConfig>) {
  const { title = 'Performance Distribution', subtitle, regions = [] } = config ?? {}

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light">
        <div className="card-title">{title}</div>
        {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="text-left">Region</th>
              <th className="text-left">Uptime</th>
              <th className="text-left">Incidents</th>
              <th className="text-left">Revenue</th>
              <th className="text-left">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((r) => (
              <tr key={r.region}>
                <td className="font-semibold">{r.region}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <MiniBar value={r.uptime} color="#03cd8c" />
                    </div>
                    <span className="text-xs">{r.uptime.toFixed(1)}%</span>
                  </div>
                </td>
                <td>
                  <span className={`pill ${r.incidents > 10 ? 'rejected' : 'pending'}`}>
                    {r.incidents}
                  </span>
                </td>
                <td>${(r.revenue / 1_000_000).toFixed(2)}M</td>
                <td>{r.sessions.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

