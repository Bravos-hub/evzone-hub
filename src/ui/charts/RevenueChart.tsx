import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { OwnerRevenueTrendPoint, RevenueTrendPoint } from '@/core/api/types'
import { Card } from '../components/Card'

interface RevenueChartProps {
    data: Array<RevenueTrendPoint | OwnerRevenueTrendPoint>
    title?: string
}

export function RevenueChart({ data, title = 'Revenue Overview' }: RevenueChartProps) {
    return (
        <Card className="min-w-0 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-text">{title}</h3>
                    <p className="text-sm text-text-secondary">Historical revenue vs operating costs</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent" />
                        <span className="text-xs text-text-secondary font-medium">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500" />
                        <span className="text-xs text-text-secondary font-medium">Cost</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <span className="text-xs text-text-secondary font-medium">Margin</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px] min-h-[300px] w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            dy={10}
                            tickFormatter={(val) => {
                                const date = new Date(val);
                                return date.toLocaleDateString('en-US', { weekday: 'short' });
                            }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '12px',
                            }}
                            itemStyle={{ color: 'var(--text)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--accent)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRev)"
                        />
                        <Area
                            type="monotone"
                            dataKey="cost"
                            stroke="#64748b"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCost)"
                        />
                        <Area
                            type="monotone"
                            dataKey="margin"
                            stroke="#34d399"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorMargin)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
