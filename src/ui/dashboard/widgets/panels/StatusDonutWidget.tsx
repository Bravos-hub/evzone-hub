import { StatusDonut } from '@/ui/charts/StatusDonut'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import { useOwnerDashboardData } from '@/modules/analytics/hooks/useOwnerDashboardData'
import type { WidgetProps } from '../../types'

export function StatusDonutWidget({ config }: WidgetProps<{ title?: string; ownerMode?: boolean }>) {
    const { data } = useDashboard()
    const owner = useOwnerDashboardData()

    if (config?.ownerMode) {
        const statusCounts = owner.data?.operations?.statusCounts
        if (!statusCounts) return null
        return <StatusDonut data={statusCounts} title={config?.title} />
    }

    if (!data?.chargers) return null

    return <StatusDonut data={data.chargers} title={config?.title} />
}
