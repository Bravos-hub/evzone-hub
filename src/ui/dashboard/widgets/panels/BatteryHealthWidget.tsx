import { Link } from 'react-router-dom'
import { Card } from '@/ui/components/Card'
import { useDashboard } from '@/core/api/hooks/useDashboard'

export function BatteryHealthWidget() {
    const { data } = useDashboard()

    if (!data) return null

    return (
        <Card className="p-6 flex flex-col gap-6 bg-purple-500/5 border-purple-500/10 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-text">Battery Health Summary</h3>
                    <p className="text-sm text-text-secondary">Fleet status across all swap stations</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Avg Health</p>
                    <div className="text-2xl font-black text-text">{data.batteryHealth?.average || 94}%</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Attention Needed</p>
                    <div className="text-2xl font-black text-red-500">{data.batteryHealth?.lowHealthCount || 0} units</div>
                </div>
            </div>

            <Link to="/inventory" className="w-full py-3 mt-auto rounded-xl bg-purple-500 text-white text-center font-bold text-sm hover:bg-purple-600 transition-colors">
                View Battery Fleet
            </Link>
        </Card>
    )
}
