import { Card } from '@/ui/components/Card'
import { useApplications } from '@/core/api/hooks/useTenants'

export function ApplicationsTableWidget({ config }: { config: any }) {
    const { data: applications, isLoading } = useApplications()
    const apps = applications || []

    if (isLoading) {
        return (
            <Card className="flex items-center justify-center p-8">
                <div className="text-muted animate-pulse">Loading applications...</div>
            </Card>
        )
    }

    return (
        <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border-light flex justify-between items-center bg-card-header">
                <div className="card-title">{config?.title || 'Applications Pipeline'}</div>
                <a href="/explore" className="text-xs text-accent hover:underline font-medium">Browse sites</a>
            </div>
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>App ID</th>
                            <th>Site Name</th>
                            <th>Rent</th>
                            <th>Term</th>
                            <th>Status</th>
                            <th className="text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-muted">No applications found.</td>
                            </tr>
                        ) : (
                            apps.map((a) => (
                                <tr key={a.id}>
                                    <td className="font-mono text-xs">{a.id}</td>
                                    <td className="font-semibold">{a.siteName}</td>
                                    <td>${a.proposedRent?.toLocaleString()}</td>
                                    <td>{a.proposedTerm} mos</td>
                                    <td>
                                        <span className={`pill ${a.status === 'Approved' ? 'approved' : a.status === 'Rejected' ? 'rejected' : 'pending'}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="text-right text-xs text-muted">
                                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A'}
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
