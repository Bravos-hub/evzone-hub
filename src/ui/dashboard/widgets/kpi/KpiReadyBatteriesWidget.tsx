import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import { KpiGenericWidget } from './KpiGenericWidget'

export function KpiReadyBatteriesWidget() {
    const { data } = useDashboard()
    if (!data) return null

    return (
        <KpiGenericWidget
            config={{
                title: 'Ready Batteries',
                value: String(data.inventory?.ready || 0),
                delta: `Out of ${data.inventory?.total || 0}`,
            }}
        />
    )
}
