import { useMemo } from 'react'
import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { WorldChoroplethMap, type ChoroplethDatum, type ChoroplethRegionId } from '@/ui/components/WorldChoroplethMap'
import { useRegionalMetrics } from '@/modules/analytics/hooks/useAnalytics'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

export type WorldMapConfig = {
  title?: string
  subtitle?: string
  data?: ChoroplethDatum[]
  lowColor?: string
  highColor?: string
}

const REGION_IDS: ChoroplethRegionId[] = ['N_AMERICA', 'EUROPE', 'AFRICA', 'ASIA', 'MIDDLE_EAST']

function normalizeRegionId(value?: string): ChoroplethRegionId | null {
  if (!value) return null
  const raw = value.toUpperCase().replace(/[\s-]+/g, '_')
  if (raw === 'AMERICAS' || raw === 'NORTH_AMERICA' || raw === 'NA') return 'N_AMERICA'
  if (raw === 'MIDDLE_EAST' || raw === 'MIDEAST') return 'MIDDLE_EAST'
  if (REGION_IDS.includes(raw as ChoroplethRegionId)) return raw as ChoroplethRegionId
  return null
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function normalizeRegionMetrics(raw: any): ChoroplethDatum | null {
  const id = normalizeRegionId(raw?.id ?? raw?.region ?? raw?.code ?? raw?.name)
  if (!id) return null

  const label = raw?.label ?? raw?.name ?? raw?.region ?? id
  const metricsSource = raw?.metrics ?? raw?.kpis ?? raw?.stats ?? raw ?? {}

  return {
    id,
    label,
    metrics: {
      stations: toNumber(metricsSource.stations ?? metricsSource.stationCount ?? metricsSource.totalStations),
      sessions: toNumber(metricsSource.sessions ?? metricsSource.sessionCount ?? metricsSource.totalSessions),
      uptime: toNumber(metricsSource.uptime ?? metricsSource.availability ?? metricsSource.sla),
      revenueUsd: toNumber(metricsSource.revenueUsd ?? metricsSource.revenue ?? metricsSource.revenueUSD ?? metricsSource.revenue_usd),
    },
  }
}

export function WorldMapWidget({ config }: WidgetProps<WorldMapConfig>) {
  const { data: regionalMetrics, isLoading } = useRegionalMetrics() as any

  const normalizedData = useMemo(() => {
    if (config?.data && config.data.length > 0) return config.data

    const source = Array.isArray(regionalMetrics)
      ? regionalMetrics
      : regionalMetrics?.regions ?? regionalMetrics?.data ?? []

    if (!Array.isArray(source)) return []

    return source
      .map((entry) => normalizeRegionMetrics(entry))
      .filter((entry): entry is ChoroplethDatum => Boolean(entry))
  }, [config?.data, regionalMetrics])

  const title = config?.title ?? 'World Map'
  const subtitle = config?.subtitle ?? 'Regional metrics'
  const lowColor = config?.lowColor ?? '#132036'
  const highColor = config?.highColor ?? '#f77f00'

  return (
    <Card>
      {isLoading && normalizedData.length === 0 ? (
        <div className="py-8">
          <TextSkeleton lines={2} centered />
        </div>
      ) : normalizedData.length === 0 ? (
        <div className="text-sm text-center py-8 text-muted">No regional metrics available.</div>
      ) : (
        <WorldChoroplethMap
          title={title}
          subtitle={subtitle}
          data={normalizedData}
          lowColor={lowColor}
          highColor={highColor}
        />
      )}
    </Card>
  )
}

