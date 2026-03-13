import { UtilizationHeatmap } from '@/ui/charts/UtilizationHeatmap'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import { useOwnerDashboardData } from '@/modules/analytics/hooks/useOwnerDashboardData'
import type { WidgetProps } from '../../types'

export function UtilizationHeatmapWidget({ config }: WidgetProps<{ title?: string; ownerMode?: boolean }>) {
    const { data } = useDashboard()
    const owner = useOwnerDashboardData()

    if (config?.ownerMode) {
        if (!owner.data?.utilization?.heatmap) return null
        return <UtilizationHeatmap data={owner.data.utilization.heatmap} />
    }

    if (!data?.trends?.utilization) return null

    return <UtilizationHeatmap data={data.trends.utilization} />
}
