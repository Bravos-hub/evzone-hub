import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { MiniBar } from '../charts/MiniBarWidget'

export type StationStatus = {
    id: string
    name: string
    location: string
    status: 'online' | 'offline' | 'warning'
    occupancy: number // 0-100
    activeSessions: number
    lastPulse: string
}

export type StationStatusTableConfig = {
    title?: string
    subtitle?: string
    stations: StationStatus[]
}

export function StationStatusTableWidget({ config }: WidgetProps<StationStatusTableConfig>) {
    const { title = 'My Stations Status', subtitle = 'Live overview of assigned charging points', stations = [] } = config ?? {}

    const getStatusColor = (status: StationStatus['status']) => {
        switch (status) {
            case 'online': return '#03cd8c'
            case 'offline': return '#ff4d4d'
            case 'warning': return '#f59e0b'
            default: return '#94a3b8'
        }
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
                            <th className="py-2 px-4 text-xs font-semibold text-muted !text-right">Sessions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stations.map((s) => (
                            <tr key={s.id} className="border-b border-border-light/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-text">{s.name}</span>
                                        <span className="text-[11px] text-muted">{s.location}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: getStatusColor(s.status), boxShadow: `0 0 8px ${getStatusColor(s.status)}80` }} />
                                        <span className="text-xs capitalize">{s.status}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16">
                                            <MiniBar value={s.occupancy} color={s.status === 'online' ? '#f77f00' : '#64748b'} />
                                        </div>
                                        <span className="text-[11px] font-mono">{s.occupancy}%</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <span className="text-sm font-semibold">{s.activeSessions}</span>
                                </td>
                            </tr>
                        ))}
                        {stations.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-muted text-sm italic">
                                    No stations assigned to your profile.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
