import { Card } from '@/ui/components/Card'
import { useSites } from '@/core/api/hooks/useSites'
import { useAuthStore } from '@/core/auth/authStore'

export function SitesTableWidget({ config }: { config: any }) {
    const { data: sitesData, isLoading: sitesLoading } = useSites()
    const { user } = useAuthStore()

    const sites = (sitesData || []).filter(s => s.ownerId === user?.id)

    if (sitesLoading) {
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
                <a href="/site-owner-sites" className="text-xs text-accent hover:underline font-medium">View all</a>
            </div>
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Site Name</th>
                            <th>City</th>
                            <th>Status</th>
                            <th className="text-right">Bays</th>
                            <th className="text-right">Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sites.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-muted">
                                    No sites found. {sitesData && sitesData.length > 0 ? `(${sitesData.length} total sites in DB, but none match your user ID)` : ''}
                                </td>
                            </tr>
                        ) : (
                            sites.map((s) => (
                                <tr key={s.id}>
                                    <td className="font-mono text-xs">{s.id.slice(0, 8)}</td>
                                    <td className="font-semibold">{s.name}</td>
                                    <td>{s.city}</td>
                                    <td>
                                        <span className={`pill ${s.status === 'ACTIVE' ? 'approved' : 'pending'}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="text-right">{s.parkingBays || 0}</td>
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
