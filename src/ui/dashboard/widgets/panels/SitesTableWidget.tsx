import { Card } from '@/ui/components/Card'
import { useStations } from '@/core/api/hooks/useStations'

export function SitesTableWidget({ config }: { config: any }) {
    const { data: stations, isLoading } = useStations()
    const sites = stations || []

    if (isLoading) {
        return (
            <Card className="flex items-center justify-center p-8">
                <div className="text-muted animate-pulse">Loading sites...</div>
            </Card>
        )
    }

    return (
        <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border-light flex justify-between items-center bg-card-header">
                <div className="card-title">{config?.title || 'My Sites & Availability'}</div>
                <a href="/sites" className="text-xs text-accent hover:underline font-medium">View all</a>
            </div>
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Station Name</th>
                            <th>City</th>
                            <th>Status</th>
                            <th className="text-right">Bays</th>
                            <th className="text-right">Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sites.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-muted">No sites found.</td>
                            </tr>
                        ) : (
                            sites.map((s) => (
                                <tr key={s.id}>
                                    <td className="font-mono text-xs">{s.id.slice(0, 8)}</td>
                                    <td className="font-semibold">{s.name}</td>
                                    <td>{s.address.split(',').pop()?.trim()}</td>
                                    <td>
                                        <span className={`pill ${(s.status as string) === 'Active' || (s.status as string) === 'ACTIVE' || (s.status as string) === 'Online' ? 'approved' : 'pending'}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="text-right">{s.capacity || 0}</td>
                                    <td className="text-right text-xs text-muted">{new Date(s.updatedAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
