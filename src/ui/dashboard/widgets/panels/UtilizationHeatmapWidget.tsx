import { UtilizationHeatmap } from '@/ui/charts/UtilizationHeatmap'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import type { WidgetProps } from '../../types'

export function UtilizationHeatmapWidget({ config }: WidgetProps<{ title?: string }>) {
    const { data } = useDashboard()
    if (!data) return null

    return <UtilizationHeatmap data={data.trends.utilization} />
}
