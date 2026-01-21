import { useSites } from '@/modules/sites/hooks/useSites'
import { useAuthStore } from '@/core/auth/authStore'

export function KpiSiteCountWidget({ config }: { config?: { type?: 'total' | 'listed' | 'leased' } }) {
    const { data: sitesData, isLoading } = useSites()
    const { user } = useAuthStore()

    const mySites = (sitesData || []).filter(s => s.ownerId === user?.id)

    let value = '0'
    let label = 'My Sites'

    if (!isLoading) {
        if (config?.type === 'total') {
            value = String(mySites.length)
            label = 'Total Sites'
        } else if (config?.type === 'listed') {
            const listed = mySites.filter(s => s.status === 'ACTIVE')
            value = String(listed.length)
            label = 'Listed Sites'
        } else if (config?.type === 'leased') {
            // Assuming ACTIVE sites are leased/occupied
            const leased = mySites.filter(s => s.status === 'ACTIVE')
            value = String(leased.length)
            label = 'Leased Sites'
        } else {
            value = String(mySites.length)
        }
    }

    return (
        <div className="kpi-card">
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{isLoading ? '—' : value}</div>
        </div>
    )
}
