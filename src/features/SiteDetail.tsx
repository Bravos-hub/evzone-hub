import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { PATHS } from '@/app/router/paths'
import { useStation, useStationStats } from '@/core/api/hooks/useStations'
import { useChargePointsByStation } from '@/core/api/hooks/useChargePoints'

export function SiteDetail() {
    const { id } = useParams<{ id: string }>()
    const nav = useNavigate()

    const { data: station, isLoading: loadingStation, error: stationError } = useStation(id!)
    const { data: stats, isLoading: loadingStats } = useStationStats(id!)
    const { data: chargePoints, isLoading: loadingCP } = useChargePointsByStation(id!)

    if (loadingStation || loadingStats || loadingCP) {
        return (
            <DashboardLayout pageTitle="Site Details">
                <div className="flex items-center justify-center h-64">
                    <div className="text-subtle">Loading site details...</div>
                </div>
            </DashboardLayout>
        )
    }

    if (stationError || !station) {
        return (
            <DashboardLayout pageTitle="Site Details">
                <div className="p-8 text-center text-red-500">
                    Failed to load site details. It may not exist.
                </div>
            </DashboardLayout>
        )
    }

    // Map stats safely
    const stationStats = stats as any || {
        totalRevenue: 0,
        totalSessions: 0,
        totalEnergy: 0,
        averageSessionDuration: 0
    }

    return (
        <DashboardLayout pageTitle="Site Details">
            <div className="mb-6">
                <Link to={PATHS.SITE_OWNER.SITES} className="text-sm text-subtle hover:text-text mb-2 inline-block">← Back to My Sites</Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{station.name}</h1>
                        <p className="text-muted">{station.address}</p>
                    </div>
                    <span className={`pill ${station.status === 'ACTIVE' ? 'approved' : station.status === 'MAINTENANCE' ? 'active' : 'declined'} text-lg px-4 py-1`}>
                        {station.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card">
                    <div className="text-xs text-muted mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-ok">${(stationStats.totalRevenue || 0).toLocaleString()}</div>
                </div>
                <div className="card">
                    <div className="text-xs text-muted mb-1">Total Sessions</div>
                    <div className="text-2xl font-bold text-accent">{stationStats.totalSessions || 0}</div>
                </div>
                <div className="card">
                    <div className="text-xs text-muted mb-1">Power Capacity</div>
                    <div className="text-2xl font-bold">{station.capacity || 0} kW</div>
                </div>
                <div className="card">
                    <div className="text-xs text-muted mb-1">Total Energy</div>
                    <div className="text-2xl font-bold">{(stationStats.totalEnergy || 0).toLocaleString()} kWh</div>
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
                            {!chargePoints || chargePoints.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-subtle">No chargers installed at this site.</td>
                                </tr>
                            ) : (
                                chargePoints.map(c => (
                                    <tr key={c.id}>
                                        <td className="font-semibold">{c.id}</td>
                                        <td>{c.model}</td>
                                        <td>{c.connectors?.reduce((max, conn) => Math.max(max, conn.maxPowerKw), 0) || 0} kW</td>
                                        <td>
                                            <span className={`pill ${c.status === 'Online' ? 'approved' :
                                                c.status === 'Offline' ? 'declined' :
                                                    'active'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                className="btn secondary text-xs font-bold"
                                                onClick={() => nav(PATHS.STATIONS.CHARGE_POINT_DETAIL(c.id))}
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    )
}
