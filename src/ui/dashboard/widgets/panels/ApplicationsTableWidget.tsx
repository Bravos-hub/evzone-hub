import { useNavigate } from 'react-router-dom'
import { Card } from '@/ui/components/Card'
import { useApplications, useUpdateApplicationStatus } from '@/modules/applications/hooks/useApplications'

export function ApplicationsTableWidget({ config }: { config: any }) {
    const navigate = useNavigate()
    const { data: applications, isLoading } = useApplications()
    const updateStatus = useUpdateApplicationStatus()
    const apps = applications || []

    const handleUpdateStatus = (id: string, status: 'Approved' | 'Rejected') => {
        if (confirm(`Are you sure you want to ${status.toLowerCase()} this application?`)) {
            updateStatus.mutate({ id, status })
        }
    }

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
                <a href="/tenants?tab=applications" className="text-xs text-accent hover:underline font-medium">View all</a>
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
                            <th className="text-right">Actions</th>
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
                                    <td>
                                        <button
                                            className="font-mono text-xs text-accent hover:underline"
                                            onClick={() => navigate(`/tenants?tab=applications&appId=${a.id}`)}
                                        >
                                            {a.id}
                                        </button>
                                    </td>
                                    <td className="font-semibold">{a.siteName}</td>
                                    <td>${a.proposedRent?.toLocaleString()}</td>
                                    <td>{a.proposedTerm} mos</td>
                                    <td>
                                        <span className={`pill ${a.status === 'Approved' ? 'approved' : a.status === 'Rejected' ? 'rejected' : 'pending'}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        {a.status === 'Pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="btn text-xs px-2 py-1 bg-ok/10 text-ok hover:bg-ok/20 border border-ok/20"
                                                    onClick={() => handleUpdateStatus(a.id, 'Approved')}
                                                    disabled={updateStatus.isPending}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn text-xs px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                                    onClick={() => handleUpdateStatus(a.id, 'Rejected')}
                                                    disabled={updateStatus.isPending}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted italic">Processed</span>
                                        )}
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
