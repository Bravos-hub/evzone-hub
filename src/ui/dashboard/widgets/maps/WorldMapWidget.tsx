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

export function WorldMapWidget({ config }: WidgetProps<WorldMapConfig>) {
  const {
    title = 'World Map',
    subtitle = 'Regional metrics',
    data = [],
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

