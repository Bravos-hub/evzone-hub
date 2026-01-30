import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import { KpiGenericWidget } from './KpiGenericWidget'

export function KpiEnergyDeliveredWidget() {
    const { data } = useDashboard()
    if (!data) return null

    if (!data?.today) return null

    return (
        <KpiGenericWidget
            config={{
                title: 'Energy Delivered',
                value: `${(data.today.energyDelivered || 0).toLocaleString()} kWh`,
                trend: 'up',
                delta: '+8% vs yesterday',
            }}
        />
    )
}
