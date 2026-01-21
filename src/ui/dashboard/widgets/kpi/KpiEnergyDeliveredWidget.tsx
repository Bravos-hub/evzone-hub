import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import { KpiGenericWidget } from './KpiGenericWidget'

export function KpiEnergyDeliveredWidget() {
    const { data } = useDashboard()
    if (!data) return null

    return (
        <KpiGenericWidget
            config={{
                title: 'Energy Delivered',
                value: `${data.today.energyDelivered.toLocaleString()} kWh`,
                trend: 'up',
                delta: '+8% vs yesterday',
            }}
        />
    )
}
