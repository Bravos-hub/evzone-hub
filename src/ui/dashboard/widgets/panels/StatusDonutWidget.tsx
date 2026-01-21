import { StatusDonut } from '@/ui/charts/StatusDonut'
import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import type { WidgetProps } from '../../types'

export function StatusDonutWidget({ config }: WidgetProps<{ title?: string }>) {
    const { data } = useDashboard()
    if (!data) return null

    return <StatusDonut data={data.chargers} title={config?.title} />
}
