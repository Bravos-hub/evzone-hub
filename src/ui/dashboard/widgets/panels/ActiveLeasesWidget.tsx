import { Card } from '@/ui/components/Card'
import { useLeases } from '@/modules/applications/hooks/useApplications'
import { TableSkeleton } from '@/ui/components/SkeletonCards'

export type ActiveLeasesConfig = {
    title?: string
    subtitle?: string
}

export function ActiveLeasesWidget({ config }: { config: ActiveLeasesConfig }) {
    const { data: leases, isLoading } = useLeases()
    const items = leases || []

    if (isLoading) {
        return (
            <Card className="p-4">
                <TableSkeleton rows={4} cols={4} />
            </Card>
        )
    }

    return (
        <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border-light bg-card-header">
                <div className="card-title">{config?.title || 'Active Leases'}</div>
                {config?.subtitle && <div className="text-xs text-muted mt-1">{config.subtitle}</div>}
            </div>
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Tenant</th>
                            <th>Site</th>
                            <th>Rent</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-muted">No active leases found.</td>
                            </tr>
                        ) : (
                            items.map((l) => (
                                <tr key={l.id}>
                                    <td className="font-semibold">{l.operator?.name || 'Unknown'}</td>
                                    <td className="text-xs">{l.siteName || 'Unknown Site'}</td>
                                    <td>{l.preferredLeaseModel === 'Fixed Rent' ? (l.proposedTerm + ' mo') : `Revenue Share`}</td>
                                    <td>
                                        <span className="pill approved">{l.status}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
