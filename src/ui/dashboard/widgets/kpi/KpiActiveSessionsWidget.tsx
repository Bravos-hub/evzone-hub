import { useDashboard } from '@/core/api/hooks/useDashboard'
import { KpiGenericWidget } from './KpiGenericWidget'

export function KpiActiveSessionsWidget() {
    const { data } = useDashboard()
    if (!data) return null

    return (
        <KpiGenericWidget
            config={{
                title: 'Active Sessions',
                value: String(data.realTime.activeSessions),
                delta: 'Vehicles charging now',
            }}
        />
    )
}
