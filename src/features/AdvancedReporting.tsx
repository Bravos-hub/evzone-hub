import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { exportToCSV } from '@/core/utils/exportUtility'
import { useSessionHistory } from '@/core/api/hooks/useSessions'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts'
import clsx from 'clsx'

export function AdvancedReporting() {
    const { data: sessionHistory, isLoading } = useSessionHistory()
    const sessions = sessionHistory?.sessions || []
    const [dateRange, setDateRange] = useState('7d')
    const [reportType, setReportType] = useState('revenue')

    const chartData = useMemo(() => {
        // Mock aggregation logic for the demo
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            return d.toLocaleDateString('en-US', { weekday: 'short' })
        })

        return last7Days.map(day => ({
            name: day,
            revenue: Math.floor(Math.random() * 500) + 200,
            utilization: Math.floor(Math.random() * 40) + 20,
            sessions: Math.floor(Math.random() * 15) + 5,
        }))
    }, [])

    const handleExport = () => {
        if (!sessions.length) return
        const exportData = sessions.map(s => ({
            ID: s.id,
            Date: new Date(s.startedAt).toLocaleDateString(),
            Station: s.stationName || 'Unknown',
            User: s.userName || 'Anonymous',
            Energy_kWh: s.energyDelivered || 0,
            Total_Amount: s.cost || 0,
            Duration: `${s.durationMinutes || 0} min`
        }))
        exportToCSV(exportData, 'evzone_revenue_report')
    }

    return (
        <DashboardLayout pageTitle="Advanced Reporting & Insights">
            <div className="flex flex-col gap-8 pb-10">
                {/* Filters & Actions Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
                        {['7d', '30d', '90d', 'YTD', 'All'].map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={clsx(
                                    'px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                                    dateRange === range ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text'
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-text hover:bg-white/10 transition-all group"
                        >
                            <svg className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Export CSV
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:bg-accent-hover transition-all">
                            Schedule Report
                        </button>
                    </div>
                </div>

                {/* Highlight Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Avg Revenue / Day', value: '$342.50', trend: '+12.4%', color: 'text-ok' },
                        { label: 'Busiest Hour', value: '18:00 - 19:00', trend: 'Peak Time', color: 'text-accent' },
                        { label: 'Energy Reliability', value: '99.98%', trend: 'Nominal', color: 'text-ok' },
                        { label: 'Churn Risk', value: 'Low', trend: '-2.1%', color: 'text-ok' },
                    ].map((stat, i) => (
                        <Card key={i} className="p-6 border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">{stat.label}</p>
                            <div className="flex items-center justify-between">
                                <p className="text-xl font-bold text-text">{stat.value}</p>
                                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5', stat.color)}>{stat.trend}</span>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 p-6 min-h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text">Performance Matrix</h3>
                            <select
                                value={reportType}
                                onChange={e => setReportType(e.target.value)}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-accent border-none focus:ring-0 cursor-pointer"
                            >
                                <option value="revenue">Revenue Forecast</option>
                                <option value="utilization">Network Utilization</option>
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey={reportType === 'revenue' ? 'revenue' : 'utilization'} stroke="#0066FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="flex flex-col gap-6">
                        <Card className="p-6 bg-accent text-white border-none shadow-2xl shadow-accent/30 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-6 opacity-80">Predictive Forecaster</h3>
                                <p className="text-xs font-bold mb-2">Estimated Monthly Close</p>
                                <p className="text-4xl font-black mb-1">$12,450.00</p>
                                <p className="text-[10px] font-bold opacity-70 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                                    +18% higher than last period
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                        </Card>

                        <Card className="p-6 border-white/10">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-6">Customer Heatmap</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Returning Customers', value: 68 },
                                    { label: 'App Reservations', value: 42 },
                                    { label: 'Fleet Managed', value: 25 },
                                ].map((bar, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold uppercase">
                                            <span className="text-text-secondary">{bar.label}</span>
                                            <span className="text-text">{bar.value}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent" style={{ width: `${bar.value}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
