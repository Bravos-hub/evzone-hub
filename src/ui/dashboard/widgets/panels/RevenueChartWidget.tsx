import { RevenueChart } from '@/ui/charts/RevenueChart'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import type { WidgetProps } from '../../types'

export function RevenueChartWidget({ config }: WidgetProps<{ title?: string }>) {
    const { data } = useDashboard()
    if (!data?.trends?.revenue) return null
    return <RevenueChart data={data.trends.revenue} title={config?.title} />
}
