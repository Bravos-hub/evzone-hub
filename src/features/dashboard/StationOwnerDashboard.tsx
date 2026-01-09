import { useDashboard } from '@/core/api/hooks/useDashboard'
import { DashboardStatCard } from '@/ui/components/DashboardStatCard'
import { RevenueChart } from '@/ui/charts/RevenueChart'
import { StatusDonut } from '@/ui/charts/StatusDonut'
import { UtilizationHeatmap } from '@/ui/charts/UtilizationHeatmap'
import { Card } from '@/ui/components/Card'
import { EVChargingAnimation } from '@/ui/components/EVChargingAnimation'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'

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
