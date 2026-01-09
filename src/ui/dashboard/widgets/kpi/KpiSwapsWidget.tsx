import { useDashboard } from '@/core/api/hooks/useDashboard'
import { KpiGenericWidget } from './KpiGenericWidget'

export function KpiSwapsWidget() {
    const { data } = useDashboard()
    if (!data) return null

    return (
        <KpiGenericWidget
            config={{
                title: 'Swaps Today',
                value: String(data.swaps?.today || 0),
                trend: 'up',
                delta: '+8% vs avg',
            }}
        />
    )
}
