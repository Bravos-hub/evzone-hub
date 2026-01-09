import { useDashboard } from '@/core/api/hooks/useDashboard'
import { DashboardStatCard } from '@/ui/components/DashboardStatCard'
import { RevenueChart } from '@/ui/charts/RevenueChart'
import { StatusDonut } from '@/ui/charts/StatusDonut'
import { UtilizationHeatmap } from '@/ui/charts/UtilizationHeatmap'
import { Card } from '@/ui/components/Card'
import { EVChargingAnimation } from '@/ui/components/EVChargingAnimation'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import type { Role } from '@/core/auth/types'
import { ROLE_LABELS } from '@/constants/roles'

export default function StationOwnerDashboard() {
    const { data, isLoading, error } = useDashboard()

    if (isLoading) {
        return (
            <DashboardLayout pageTitle="Dashboard">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <div className="w-24 h-24 overflow-hidden flex items-center justify-center">
                        <EVChargingAnimation />
                    </div>
                    <p className="text-text-secondary animate-pulse">Loading dashboard metrics...</p>
                </div>
            </DashboardLayout>
        )
    }

    if (error || !data) {
        return (
            <DashboardLayout pageTitle="Dashboard">
                <Card className="p-8 text-center flex flex-col items-center gap-4 bg-red-500/5 border-red-500/20">
                    <div className="p-3 rounded-full bg-red-500/10 text-red-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-text">Failed to load dashboard</h3>
                    <p className="text-text-secondary">Something went wrong while fetching your analytics. Please try again later.</p>
                </Card>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout pageTitle="Station Owner Dashboard">
            <div className="flex flex-col gap-6 lg:gap-8 pb-10">
                {/* Header Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <DashboardStatCard
                        title="Daily Revenue"
                        value={`$${data.today.revenue.toLocaleString()}`}
                        trend={{ value: 12, label: 'vs yesterday', isPositive: true }}
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                            </svg>
                        }
                    />
                    <DashboardStatCard
                        title="Active Sessions"
                        value={data.realTime.activeSessions}
                        subtitle="Vehicles currently charging"
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        }
                    />
                    <DashboardStatCard
                        title="Energy Delivered"
                        value={`${data.today.energyDelivered.toLocaleString()} kWh`}
                        trend={{ value: 8, label: 'vs yesterday', isPositive: true }}
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        }
                    />
                    <DashboardStatCard
                        title="Uptime Rate"
                        value="98.5%"
                        trend={{ value: 0.5, label: 'vs last week', isPositive: true }}
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                        }
                    />
                </div>

                {/* Middle Row: Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                    <div className="xl:col-span-2">
                        <RevenueChart data={data.trends.revenue} />
                    </div>
                    <div>
                        <StatusDonut data={data.chargers} />
                    </div>
                </div>

                {/* Quick Management & Team Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Quick Management */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ManagementCard
                            title="Manage Stations"
                            count={data.chargers.total}
                            label="Active Units"
                            path="/stations"
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        />
                        <ManagementCard
                            title="Sites & Leases"
                            count={2}
                            label="Active Sites"
                            path="/sites"
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>}
                        />
                        <ManagementCard
                            title="Wallet & Payouts"
                            count={`$${data.realTime.currentRevenue.toLocaleString()}`}
                            label="Available"
                            path="/wallet"
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                        />
                    </div>

                    {/* Team Quick View */}
                    <Card className="p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wider text-text">Team Activity</h3>
                            <button
                                onClick={() => window.location.href = '/team'}
                                className="text-[10px] font-black uppercase tracking-wider text-accent hover:underline"
                            >
                                Manage Team
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {[
                                { name: 'Grace Manager', role: 'MANAGER' as Role },
                                { name: 'Allan Tech', role: 'TECHNICIAN_ORG' as Role },
                                { name: 'Cathy Cashier', role: 'CASHIER' as Role },
                            ].map((m, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent uppercase">
                                            {m.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-text leading-none">{m.name}</p>
                                            <p className="text-[10px] text-text-secondary">{ROLE_LABELS[m.role]}</p>
                                        </div>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => window.location.href = '/team'}
                            className="w-full py-2.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-wider text-text-secondary hover:bg-white/10 transition-all text-center"
                        >
                            + Invite Staff
                        </button>
                    </Card>
                </div>

                {/* Bottom Row: Heatmap & Top Stations */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    <UtilizationHeatmap data={data.trends.utilization} />

                    <Card className="p-6 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-text">Top Performing Stations</h3>
                                <p className="text-sm text-text-secondary">By revenue & utilization this month</p>
                            </div>
                            <button className="text-xs font-bold text-accent hover:text-accent-hover transition-colors uppercase tracking-wider">
                                View All
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {data.trends.topStations.map((station, i) => (
                                <div key={station.stationId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text">{station.stationName}</p>
                                            <p className="text-xs text-text-secondary">{station.sessions} sessions this month</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-text">${station.revenue.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-green-500 uppercase">{station.uptime}% Uptime</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

function ManagementCard({ title, count, label, path, icon }: { title: string, count: string | number, label: string, path: string, icon: React.ReactNode }) {
    return (
        <button
            onClick={() => window.location.href = path}
            className="card p-5 border-white/5 hover:border-accent/30 transition-all group text-left flex flex-col gap-3"
        >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary group-hover:text-text transition-colors">{title}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-text">{count}</span>
                    <span className="text-[10px] font-bold text-text-secondary lowercase">{label}</span>
                </div>
            </div>
        </button>
    )
}
