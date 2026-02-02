import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { MiniBar } from '../charts/MiniBarWidget'
import { useStations } from '@/modules/stations/hooks/useStations'
import { useMemo } from 'react'
import { LoadingRow } from '@/ui/components/SkeletonCards'

export type StationStatusTableConfig = {
    title?: string
    subtitle?: string
    statusFilter?: string
    maxStations?: number
}

export function StationStatusTableWidget({ config }: WidgetProps<StationStatusTableConfig>) {
    const {
        title = 'My Stations Status',
        subtitle = 'Live overview of assigned charging points',
        statusFilter,
        maxStations = 10
    } = config ?? {}

    // Fetch stations from API
    const { data: stations, isLoading } = useStations({
        status: statusFilter,
        limit: maxStations,
    })

    const stationsList = useMemo(() => {
        if (!stations) return []
        return stations.slice(0, maxStations)
    }, [stations, maxStations])

    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase()
        if (statusLower === 'available' || statusLower === 'online') return '#03cd8c'
        if (statusLower === 'offline' || statusLower === 'faulted') return '#ff4d4d'
        if (statusLower === 'charging' || statusLower === 'occupied') return '#f59e0b'
        return '#94a3b8'
    }

    const calculateOccupancy = (station: any) => {
        // Calculate occupancy based on active connectors
        if (!station.connectors || station.connectors.length === 0) return 0
        const occupied = station.connectors.filter((c: any) => c.status === 'Charging' || c.status === 'Occupied').length
        return Math.round((occupied / station.connectors.length) * 100)
    }

    return (
        <Card className="p-0">
            <div className="p-4 border-b border-border-light flex items-center justify-between">
                <div>
                    <div className="card-title">{title}</div>
                    {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
                </div>
                <div className="flex gap-2">
                    <span className="text-[10px] uppercase font-bold text-muted bg-panel px-2 py-0.5 rounded-md border border-border-light">Live</span>
                </div>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr className="bg-panel/30">
                            <th className="text-left py-2 px-4 text-xs font-semibold text-muted">Station</th>
                            <th className="text-left py-2 px-4 text-xs font-semibold text-muted">Status</th>
                            <th className="text-left py-2 px-4 text-xs font-semibold text-muted">Occupancy</th>
                            <th className="py-2 px-4 text-xs font-semibold text-muted !text-right">Connectors</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <LoadingRow colSpan={4} />
                        ) : stationsList.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-muted text-sm italic">
                                    No stations assigned to your profile.
                                </td>
                            </tr>
                        ) : (
                            stationsList.map((s: any) => {
                                const occupancy = calculateOccupancy(s)
                                const statusColor = getStatusColor(s.status)

                                return (
                                    <tr key={s.id} className="border-b border-border-light/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-text">{s.name || s.stationId}</span>
                                                <span className="text-[11px] text-muted">{s.location || s.address || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-2 w-2 rounded-full shadow-[0_0_8px]"
                                                    style={{
                                                        backgroundColor: statusColor,
                                                        boxShadow: `0 0 8px ${statusColor}80`
                                                    }}
                                                />
                                                <span className="text-xs capitalize">{s.status || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16">
                                                    <MiniBar
                                                        value={occupancy}
                                                        color={s.status === 'Available' ? '#f77f00' : '#64748b'}
                                                    />
                                                </div>
                                                <span className="text-[11px] font-mono">{occupancy}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="text-sm font-semibold">{s.connectors?.length || 0}</span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
