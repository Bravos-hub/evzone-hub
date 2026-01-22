import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { useLeases } from '@/modules/applications/hooks/useApplications'
import { EVChargingAnimation } from '@/ui/components/EVChargingAnimation'
import clsx from 'clsx'

export function LeaseCompliance() {
    const { data: leases, isLoading } = useLeases()

    if (isLoading) {
        return (
            <DashboardLayout pageTitle="Lease & Compliance">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <div className="w-24 h-24 overflow-hidden flex items-center justify-center">
                        <EVChargingAnimation />
                    </div>
                    <p className="text-text-secondary animate-pulse">Analyzing lease agreements...</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout pageTitle="Lease & Expansion Compliance">
            <div className="flex flex-col gap-6 lg:gap-8 pb-10">
                {/* Top KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-accent/5 border-accent/20">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Total Active Leases</span>
                            <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-text">{leases?.length || 0}</p>
                        <p className="text-xs text-text-secondary mt-1">Sites occupied across 2 regions</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Next Rent Due</span>
                            <div className="p-2 rounded-lg bg-warn/10 text-warn">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-text">$4,250</p>
                        <p className="text-xs text-warn mt-1 font-bold">In 5 days (Westside Plaza)</p>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Expansion Capacity</span>
                            <div className="p-2 rounded-lg bg-ok/10 text-ok">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-text">12 Units</p>
                        <p className="text-xs text-text-secondary mt-1">Approved power headspace</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Contracts List */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Site Lease Details</h3>
                        <div className="flex flex-col gap-3">
                            {leases?.map(lease => (
                                <Card key={lease.id} className="p-5 border-white/5 hover:bg-white/[0.02] transition-all">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-bold text-text mb-1">{lease.siteName || 'Unknown Site'}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase text-text-secondary">Model: {lease.preferredLeaseModel || 'Standard'}</span>
                                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase text-text-secondary">Start: {lease.leaseStartDate ? new Date(lease.leaseStartDate).toLocaleDateString() : 'Pending'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-text">${(0).toLocaleString()} {/* TODO: earnings */}</p>
                                            <p className="text-[9px] font-bold text-text-secondary uppercase">Site Earnings Share</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Reconciliation & Alerts */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Critical Alerts & Reconciliation</h3>
                        <div className="flex flex-col gap-3">
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text">Contract Expiring</p>
                                    <p className="text-xs text-text-secondary mt-0.5">Downtown Hub lease expires in 42 days. Renew by end of month.</p>
                                </div>
                            </div>

                            <Card className="p-5 border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-text">Utility Reconciliation</h4>
                                    <span className="text-[10px] font-bold text-ok uppercase">In Sync</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-text-secondary">Network Energy Consumed</span>
                                        <span className="text-text font-bold">12,450 kWh</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-text-secondary">Billed by Utilities</span>
                                        <span className="text-text font-bold">12,482 kWh</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent w-[99.8%]" />
                                    </div>
                                    <p className="text-[10px] text-text-secondary text-right italic">+0.2% variance (within acceptable loss)</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
