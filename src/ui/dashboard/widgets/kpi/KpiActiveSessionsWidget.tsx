import { useDashboard } from '@/modules/analytics/hooks/useDashboard'
import { KpiGenericWidget } from './KpiGenericWidget'

export function KpiActiveSessionsWidget() {
    const { data } = useDashboard()
    if (!data) return null

    if (!data?.realTime) return null

    return (
        <KpiGenericWidget
            config={{
                title: 'Active Sessions',
                value: String(data.realTime.activeSessions || 0),
                delta: 'Vehicles charging now',
            }}
        />
    )
}
