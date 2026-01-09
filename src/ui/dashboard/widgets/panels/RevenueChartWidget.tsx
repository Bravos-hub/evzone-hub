import { RevenueChart } from '@/ui/charts/RevenueChart'
import { useDashboard } from '@/core/api/hooks/useDashboard'
import type { WidgetProps } from '../../types'

export function RevenueChartWidget({ config }: WidgetProps<{ title?: string }>) {
    const { data } = useDashboard()
    if (!data) return null

    return <RevenueChart data={data.trends.revenue} title={config?.title} />
}
