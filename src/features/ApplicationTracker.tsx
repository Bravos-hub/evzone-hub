import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { useApplications } from '@/modules/applications/hooks/useApplications'
import type { TenantApplication } from '@/core/api/types'
import clsx from 'clsx'
import { EVChargingAnimation } from '@/ui/components/EVChargingAnimation'

export function ApplicationTracker() {
    const { data: applications, isLoading } = useApplications()
    const [selectedApp, setSelectedApp] = useState<TenantApplication | null>(null)

    if (isLoading) {
        return (
            <DashboardLayout pageTitle="Expansion Tracker">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <div className="w-24 h-24 overflow-hidden flex items-center justify-center">
                        <EVChargingAnimation />
                    </div>
                    <p className="text-text-secondary animate-pulse">Tracking site applications...</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout pageTitle="Site Expansion Tracker">
            <div className="flex flex-col gap-8 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Application List */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">My Pending Applications</h3>
                            <button
                                onClick={() => window.location.href = '/apply-for-site'}
                                className="px-4 py-2 rounded-lg bg-accent text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all"
                            >
                                + New Site Application
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {applications?.length === 0 ? (
                                <Card className="p-12 text-center border-dashed border-white/10 bg-transparent">
                                    <p className="text-sm text-text-secondary">No active applications for new sites.</p>
                                </Card>
                            ) : (
                                applications?.map(app => (
                                    <Card
                                        key={app.id}
                                        className={clsx(
                                            'p-5 border-white/5 hover:border-accent/30 transition-all cursor-pointer group',
                                            selectedApp?.id === app.id && 'border-accent bg-accent/5'
                                        )}
                                        onClick={() => setSelectedApp(app)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={clsx(
                                                    'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs',
                                                    app.status === 'APPROVED' ? 'bg-ok/10 text-ok' :
                                                        app.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-accent/10 text-accent'
                                                )}>
                                                    {(app.siteName || 'U')[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-text group-hover:text-accent transition-colors">{app.siteName || 'Unknown Site'}</h4>
                                                    <p className="text-xs text-text-secondary">{app.preferredLeaseModel || 'Standard'} • Applied {new Date(app.submittedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={clsx(
                                                    'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
                                                    app.status === 'APPROVED' ? 'bg-ok/20 text-ok' :
                                                        app.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' :
                                                            'bg-accent/20 text-accent'
                                                )}>
                                                    {app.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Details Sidebar */}
                    <div className="flex flex-col gap-6">
                        {selectedApp ? (
                            <Card className="p-6 border-white/10 bg-white/[0.02] flex flex-col gap-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <h3 className="text-lg font-bold text-text">Application Detail</h3>
                                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">{selectedApp.id}</span>
                                </div>

                                <div className="space-y-6">
                                    <section>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Proposed Model</label>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                            <p className="text-sm font-bold text-text">{selectedApp.preferredLeaseModel}</p>
                                            <p className="text-xs text-text-secondary mt-1">Estimating {selectedApp.numberOfChargingPoints || 0} charge points</p>
                                        </div>
                                    </section>

                                    <section>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Site Owner Message</label>
                                        <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
                                            <p className="text-xs text-text leading-relaxed italic">
                                                "{selectedApp.responseMessage || 'Review in progress. Our site management team will contact you shortly regarding the commercial terms.'}"
                                            </p>
                                        </div>
                                    </section>

                                    {selectedApp.proposedRent && (
                                        <section>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Proposed Commercials</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                                                    <p className="text-[10px] text-text-secondary uppercase">Rent</p>
                                                    <p className="text-sm font-bold text-text">${selectedApp.proposedRent}/mo</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                                                    <p className="text-[10px] text-text-secondary uppercase">Term</p>
                                                    <p className="text-sm font-bold text-text">{selectedApp.proposedTerm} mo</p>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-white/10 transition-all">
                                        View Proposal Document
                                    </button>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-8 text-center border-dashed border-white/10 bg-transparent flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-text-secondary">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-sm text-text-secondary">Select an application to view status updates, site owner feedback, and proposed terms.</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
