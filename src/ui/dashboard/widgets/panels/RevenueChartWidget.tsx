import { RevenueChart } from '@/ui/charts/RevenueChart'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import { useOwnerDashboardData } from '@/modules/analytics/hooks/useOwnerDashboardData'
import type { WidgetProps } from '../../types'

export function RevenueChartWidget({ config }: WidgetProps<{ title?: string; ownerMode?: boolean }>) {
    const { data } = useDashboard()
    const owner = useOwnerDashboardData()

    if (config?.ownerMode) {
        if (!owner.data?.commercial?.revenueCostMarginTrend) return null
        return <RevenueChart data={owner.data.commercial.revenueCostMarginTrend} title={config?.title} />
    }

    if (!data?.trends?.revenue) return null
    return <RevenueChart data={data.trends.revenue} title={config?.title} />
}
