import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { WorldChoroplethMap, type ChoroplethDatum } from '@/ui/components/WorldChoroplethMap'

export type WorldMapConfig = {
  title?: string
  subtitle?: string
  data: ChoroplethDatum[]
  lowColor?: string
  highColor?: string
}

// Default mock data (Migration from dashboardConfigs.ts)
const DEFAULT_DATA: ChoroplethDatum[] = [
  { id: 'N_AMERICA', label: 'North America', metrics: { stations: 540, sessions: 182000, uptime: 99.4, revenueUsd: 1240000 } },
  { id: 'EUROPE', label: 'Europe', metrics: { stations: 430, sessions: 154000, uptime: 99.1, revenueUsd: 1050000 } },
  { id: 'AFRICA', label: 'Africa', metrics: { stations: 210, sessions: 72000, uptime: 98.6, revenueUsd: 460000 } },
  { id: 'ASIA', label: 'Asia', metrics: { stations: 380, sessions: 141000, uptime: 99.2, revenueUsd: 980000 } },
  { id: 'MIDDLE_EAST', label: 'Middle East', metrics: { stations: 190, sessions: 61000, uptime: 98.9, revenueUsd: 410000 } },
]

export function WorldMapWidget({ config }: WidgetProps<WorldMapConfig>) {
  const {
    title = 'World Map',
    subtitle = 'Regional metrics',
    data = DEFAULT_DATA,
    lowColor = '#132036',
    highColor = '#f77f00',
  } = config ?? {}

  return (
    <Card>
      <WorldChoroplethMap
        title={title}
        subtitle={subtitle}
        data={data}
        lowColor={lowColor}
        highColor={highColor}
      />
    </Card>
  )
}

