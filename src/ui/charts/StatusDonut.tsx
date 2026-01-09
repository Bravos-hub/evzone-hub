import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card } from '../components/Card'

interface StatusDonutProps {
    data: {
        total: number
        online: number
        offline: number
        maintenance: number
    }
}

export function StatusDonut({ data }: StatusDonutProps) {
    const chartData = [
        { name: 'Online', value: data.online, color: '#10b981' }, // Green-500
        { name: 'Offline', value: data.offline, color: '#ef4444' }, // Red-500
        { name: 'Maintenance', value: data.maintenance, color: '#f59e0b' }, // Amber-500
    ].filter(d => d.value > 0)

    return (
        <Card className="p-6 flex flex-col gap-6">
            <div>
                <h3 className="text-lg font-bold text-text">Charger Status</h3>
                <p className="text-sm text-text-secondary">Current availability of your network</p>
            </div>

            <div className="h-[250px] w-full relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-text">{data.total}</span>
                    <span className="text-xs text-text-secondary uppercase font-bold tracking-tighter">Total</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '12px',
                            }}
                            itemStyle={{ color: 'var(--text)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-3">
                {chartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm text-text-secondary font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-text">{item.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    )
}
