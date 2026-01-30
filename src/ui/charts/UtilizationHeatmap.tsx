import type { UtilizationHour } from '@/core/api/types'
import { Card } from '../components/Card'
import clsx from 'clsx'

interface UtilizationHeatmapProps {
    data: UtilizationHour[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function UtilizationHeatmap({ data }: UtilizationHeatmapProps) {
    if (!data || !Array.isArray(data)) return null

    const getIntensityColor = (utilization: number) => {
        if (utilization === 0) return 'bg-white/5'
        if (utilization < 30) return 'bg-accent/20'
        if (utilization < 60) return 'bg-accent/50'
        if (utilization < 85) return 'bg-accent/80'
        return 'bg-accent'
    }

    return (
        <Card className="p-6 flex flex-col gap-6 overflow-hidden">
            <div>
                <h3 className="text-lg font-bold text-text">Utilization Heatmap</h3>
                <p className="text-sm text-text-secondary">Peak charging hours across the week</p>
            </div>

            <div className="flex flex-col gap-1 overflow-x-auto pb-4">
                {/* Day labels + Heatmap cells */}
                {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-1 min-w-[600px]">
                        <span className="w-10 text-[10px] uppercase font-bold text-text-secondary flex-shrink-0">{day}</span>
                        <div className="flex flex-1 gap-1">
                            {HOURS.map((hour) => {
                                const item = data.find((d) => d.day === day && d.hour === hour)
                                const utilization = item?.utilization ?? 0
                                return (
                                    <div
                                        key={hour}
                                        className={clsx(
                                            'h-6 flex-1 rounded-sm transition-all duration-200 hover:scale-110 hover:z-10 cursor-pointer relative group',
                                            getIntensityColor(utilization)
                                        )}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-panel text-[10px] text-text rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none border border-white/10 shadow-xl">
                                            {hour}:00 - {utilization}% Use
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {/* Hour labels */}
                <div className="flex items-center gap-1 min-w-[600px] mt-2 border-t border-white/5 pt-2">
                    <span className="w-10 flex-shrink-0" />
                    <div className="flex flex-1 gap-1">
                        {HOURS.map((hour) => (
                            <span key={hour} className="flex-1 text-[9px] text-text-secondary text-center">
                                {hour % 4 === 0 ? `${hour}:00` : ''}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-auto">
                <span className="text-[10px] text-text-secondary uppercase font-bold">Intensity:</span>
                <div className="flex items-center gap-1.5 font-medium">
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-white/5" />
                        <span className="text-[10px] text-text-secondary">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent/20" />
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent/50" />
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent/80" />
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
                        <span className="text-[10px] text-text-secondary">High</span>
                    </div>
                </div>
            </div>
        </Card>
    )
}
