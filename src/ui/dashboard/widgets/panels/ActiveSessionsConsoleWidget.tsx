import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { useActiveSessions } from '@/modules/sessions/hooks/useSessions'
import { useMemo } from 'react'

export type ActiveSessionsConsoleConfig = {
    title?: string
    subtitle?: string
    maxSessions?: number
    statusFilter?: string
}

export function ActiveSessionsConsoleWidget({ config }: WidgetProps<ActiveSessionsConsoleConfig>) {
    const {
        title = 'Active Sessions Console',
        subtitle = 'Real-time bay monitoring & controls',
        maxSessions = 10,
        statusFilter
    } = config ?? {}

    // Fetch active sessions from API
    const { data: sessions, isLoading } = useActiveSessions()

    const activeSessions = useMemo(() => {
        if (!sessions) return []
        return sessions.slice(0, maxSessions)
    }, [sessions, maxSessions])

    const getTimeElapsed = (startTime: string | Date) => {
        const now = new Date()
        const start = new Date(startTime)
        const diffMs = now.getTime() - start.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)

        if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`
        return `${diffMins}m`
    }

    return (
        <Card className="p-0 overflow-hidden border-accent/20 bg-panel/30">
            <div className="p-4 bg-accent/5 border-b border-border-light flex items-center justify-between">
                <div>
                    <div className="card-title text-accent-light">{title}</div>
                    {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Live Console</span>
                </div>
            </div>

            <div className="p-4 grid gap-3">
                {isLoading ? (
                    <div className="py-12 text-center text-muted text-sm">Loading sessions...</div>
                ) : activeSessions.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-border-light rounded-2xl flex flex-col items-center justify-center gap-2 grayscale opacity-50">
                        <div className="text-sm font-semibold text-muted">No active sessions in this zone</div>
                        <button className="text-xs font-bold text-accent">Initialize Bay Scan →</button>
                    </div>
                ) : (
                    activeSessions.map((s: any) => {
                        const soc = s.batteryLevel || s.soc || 0
                        const powerKw = s.powerKw || s.currentPower || 0
                        const cost = s.totalCost || s.cost || 0

                        return (
                            <div key={s.id} className="p-4 rounded-xl bg-panel border border-border-light hover:border-accent/40 shadow-sm transition-all flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-bg-secondary flex items-center justify-center border border-border-light font-bold text-accent">
                                            {s.connectorId || s.bay || 'N/A'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-text">{s.userName || s.user || 'Unknown User'}</div>
                                            <div className="text-[11px] text-muted">{s.vehicleModel || s.carModel || 'Unknown Vehicle'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-text">${cost.toFixed(2)}</div>
                                        <div className="text-[10px] text-muted">{powerKw.toFixed(1)} kW Live</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted">
                                            <span>Charge State</span>
                                            <span className="text-accent">{soc}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden border border-border-light/50">
                                            <div
                                                className="h-full bg-accent-gradient transition-all duration-1000"
                                                style={{ width: `${soc}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-light text-[11px] font-bold hover:bg-panel transition-colors">Details</button>
                                        <button className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-colors">Stop Session</button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="p-3 bg-panel/40 border-t border-border-light flex justify-center">
                <button className="text-[11px] font-bold text-muted uppercase tracking-widest hover:text-accent transition-colors">
                    View All Active Bays ({sessions?.length || 0})
                </button>
            </div>
        </Card>
    )
}
