import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { PATHS } from '@/app/router/paths'

export function SiteDetail() {
    const { id } = useParams()

    // Mock data - normally fetched by ID
    const site = {
        id: id || 'SITE-001',
        name: 'City Mall Rooftop',
        address: 'Kampala Road, Kampala',
        status: 'Active',
        power: 150,
        bays: 10,
        revenue: 4520,
        utilization: 78,
        chargers: [
            { id: 'CP-001', model: 'Delta DC Wallbox', power: '25kW', status: 'Available' },
            { id: 'CP-002', model: 'Delta DC Wallbox', power: '25kW', status: 'Charging' },
            { id: 'CP-003', model: 'Delta DC Wallbox', power: '25kW', status: 'Offline' },
        ]
    }

    return (
        <DashboardLayout pageTitle="Site Details">
            <div className="mb-6">
                <Link to={PATHS.SITE_OWNER.SITES} className="text-sm text-subtle hover:text-text mb-2 inline-block">← Back to My Sites</Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{site.name}</h1>
                        <p className="text-muted">{site.address}</p>
                    </div>
                    <span className={`pill ${site.status === 'Active' ? 'approved' : 'pending'} text-lg px-4 py-1`}>{site.status}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card">
                    <div className="text-xs text-muted mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-ok">${site.revenue.toLocaleString()}</div>
                </div>
                <div className="card">
                    <div className="text-xs text-muted mb-1">Utilization</div>
                    <div className="text-2xl font-bold text-accent">{site.utilization}%</div>
                </div>
                <div className="card">
                    <div className="text-xs text-muted mb-1">Power Capacity</div>
                    <div className="text-2xl font-bold">{site.power} kW</div>
                </div>
                <div className="card">
                    <div className="text-xs text-muted mb-1">Parking Bays</div>
                    <div className="text-2xl font-bold">{site.bays}</div>
                </div>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold mb-4">Installed Chargers</h2>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Charger ID</th>
                                <th>Model</th>
                                <th>Max Power</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {site.chargers.map(c => (
                                <tr key={c.id}>
                                    <td className="font-semibold">{c.id}</td>
                                    <td>{c.model}</td>
                                    <td>{c.power}</td>
                                    <td><span className={`pill ${c.status === 'Available' ? 'approved' : c.status === 'Charging' ? 'active' : 'declined'}`}>{c.status}</span></td>
                                    <td className="text-right">
                                        <button className="btn secondary text-xs">Manage</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    )
}
