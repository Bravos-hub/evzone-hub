import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { useIncidents, useAssignIncident, useAddIncidentNote } from '@/modules/incidents/hooks/useIncidents'
import { useUsers } from '@/modules/auth/hooks/useUsers'
import type { Incident, IncidentSeverity, IncidentStatus } from '@/core/api/types'
import { ROLE_LABELS } from '@/constants/roles'
import clsx from 'clsx'
import { EVChargingAnimation } from '@/ui/components/EVChargingAnimation'

export function OwnerIncidentCenter() {
    const { data: incidents, isLoading } = useIncidents()
    const { data: users } = useUsers()

    const [activeTab, setActiveTab] = useState<IncidentStatus | 'ALL'>('ALL')
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

    const technicians = useMemo(() => {
        if (!users) return []
        return users.filter(u => u.role === 'TECHNICIAN_ORG')
    }, [users])

    const filtered = useMemo(() => {
        if (!incidents) return []
        if (activeTab === 'ALL') return incidents
        return incidents.filter(i => i.status === activeTab)
    }, [incidents, activeTab])

    if (isLoading) {
        return (
            <DashboardLayout pageTitle="Incident Center">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <div className="w-24 h-24 overflow-hidden flex items-center justify-center">
                        <EVChargingAnimation />
                    </div>
                    <p className="text-text-secondary animate-pulse">Scanning network for alerts...</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout pageTitle="Maintenance & Incident Center">
            <div className="flex flex-col gap-6 lg:gap-8 pb-10">
                {/* Top Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard title="Total Alerts" value={incidents?.length || 0} icon="alert" />
                    <StatCard
                        title="Open Now"
                        value={incidents?.filter(i => i.status === 'OPEN').length || 0}
                        icon="warning"
                        color="text-red-500"
                    />
                    <StatCard
                        title="In Progress"
                        value={incidents?.filter(i => i.status === 'IN_PROGRESS').length || 0}
                        icon="tools"
                        color="text-warn"
                    />
                    <StatCard
                        title="Resolved (24h)"
                        value={incidents?.filter(i => i.status === 'RESOLVED').length || 0}
                        icon="check"
                        color="text-ok"
                    />
                </div>

                {/* Main Interface */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Incident List */}
                    <div className="xl:col-span-2 flex flex-col gap-4">
                        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl w-fit">
                            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={clsx(
                                        'px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
                                        activeTab === tab ? 'bg-accent text-white shadow-lg' : 'text-text-secondary hover:text-text'
                                    )}
                                >
                                    {tab.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            {filtered.map(incident => (
                                <Card
                                    key={incident.id}
                                    className={clsx(
                                        'p-4 border-white/5 hover:border-accent/30 transition-all cursor-pointer group',
                                        selectedIncident?.id === incident.id && 'border-accent bg-accent/5'
                                    )}
                                    onClick={() => setSelectedIncident(incident)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <SeverityIndicator severity={incident.severity} />
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">{incident.id}</span>
                                                    <span className="text-sm font-bold text-text group-hover:text-accent transition-colors">{incident.title}</span>
                                                </div>
                                                <p className="text-xs text-text-secondary mb-2">{incident.stationName} • {incident.chargerId || 'All Units'}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className={clsx(
                                                        'px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border',
                                                        incident.status === 'OPEN' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                            incident.status === 'IN_PROGRESS' ? 'bg-warn/10 border-warn/20 text-warn' :
                                                                'bg-ok/10 border-ok/20 text-ok'
                                                    )}>
                                                        {incident.status.replace('_', ' ')}
                                                    </span>
                                                    {incident.assignedName && (
                                                        <span className="text-[10px] text-text-secondary flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                            Assigned to <span className="text-text font-bold">{incident.assignedName}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-text-secondary block mb-1">Reported {new Date(incident.createdAt).toLocaleDateString()}</span>
                                            {incident.errorCode && <code className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-red-400 font-mono tracking-tighter">{incident.errorCode}</code>}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Details Sidebar */}
                    <div className="flex flex-col gap-6">
                        {selectedIncident ? (
                            <Card className="p-6 border-white/10 flex flex-col gap-6 sticky top-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <h3 className="text-lg font-bold text-text">Service Detail</h3>
                                    <button onClick={() => setSelectedIncident(null)} className="text-text-secondary hover:text-text">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <section>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1 block">Description</label>
                                        <p className="text-sm text-text leading-relaxed">{selectedIncident.description}</p>
                                    </section>

                                    <section className="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Assigned Specialist</label>
                                            <button
                                                onClick={() => setIsAssignModalOpen(true)}
                                                className="text-[10px] font-black text-accent uppercase tracking-wider hover:underline"
                                            >
                                                {selectedIncident.assignedTo ? 'Change' : 'Assign Staff'}
                                            </button>
                                        </div>
                                        {selectedIncident.assignedName ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-xs font-black text-accent">
                                                    {selectedIncident.assignedName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text">{selectedIncident.assignedName}</p>
                                                    <p className="text-[10px] text-text-secondary">Technician (Org)</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-text-secondary italic">Unassigned</p>
                                        )}
                                    </section>

                                    <section>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-2 block">Maintenance Notes</label>
                                        <div className="flex flex-col gap-3 min-h-[100px] max-h-[200px] overflow-y-auto mb-4">
                                            {selectedIncident.notes.length === 0 ? (
                                                <p className="text-xs text-text-secondary italic">No notes logged yet.</p>
                                            ) : (
                                                selectedIncident.notes.map(note => (
                                                    <div key={note.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-accent">{note.authorName}</span>
                                                            <span className="text-[9px] text-text-secondary">{new Date(note.createdAt).toLocaleTimeString()}</span>
                                                        </div>
                                                        <p className="text-text-secondary">{note.content}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                                placeholder="Log a technical entry..."
                                            />
                                            <button className="absolute bottom-2 right-2 px-3 py-1 bg-accent text-white text-[10px] font-black rounded-lg">POST</button>
                                        </div>
                                    </section>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-8 text-center border-dashed border-white/10 bg-transparent flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-text-secondary">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-sm text-text-secondary">Select an incident to view technical details, logs, and assignment options.</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Assign Modal */}
            {isAssignModalOpen && selectedIncident && (
                <AssignTechnicianModal
                    onClose={() => setIsAssignModalOpen(false)}
                    incident={selectedIncident}
                    technicians={technicians}
                />
            )}
        </DashboardLayout>
    )
}

function StatCard({ title, value, icon, color = 'text-text' }: { title: string, value: number, icon: string, color?: string }) {
    return (
        <Card className="p-5 border-white/5 bg-white/[0.02]">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-text-secondary mb-1">{title}</p>
            <p className={clsx('text-3xl font-black', color)}>{value}</p>
        </Card>
    )
}

function SeverityIndicator({ severity }: { severity: IncidentSeverity }) {
    const colors = {
        CRITICAL: 'bg-red-500 shadow-red-500/50',
        HIGH: 'bg-warn shadow-warn/50',
        MEDIUM: 'bg-accent shadow-accent/50',
        LOW: 'bg-ok shadow-ok/50'
    }
    return <div className={clsx('w-1.5 h-12 rounded-full shadow-[0_0_10px]', colors[severity])} />
}

interface AssignTechnicianModalProps {
    onClose: () => void
    incident: Incident
    technicians: any[]
}

function AssignTechnicianModal({ onClose, incident, technicians }: AssignTechnicianModalProps) {
    const assignMutation = useAssignIncident()

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-sm p-6 shadow-2xl border-white/10">
                <h2 className="text-xl font-bold text-text mb-4">Assign Maintenance Staff</h2>
                <div className="flex flex-col gap-3">
                    {technicians.length === 0 ? (
                        <p className="text-sm text-text-secondary italic">No organzation technicians registered.</p>
                    ) : (
                        technicians.map(tech => (
                            <button
                                key={tech.id}
                                onClick={async () => {
                                    await assignMutation.mutateAsync({
                                        id: incident.id,
                                        data: { assignedTo: tech.id }
                                    })
                                    onClose()
                                }}
                                className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:border-accent transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xs font-black text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                                    {tech.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text">{tech.name}</p>
                                    <p className="text-[10px] text-text-secondary">Specialist</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 rounded-xl font-bold text-sm text-text-secondary hover:bg-white/5 transition-colors"
                >
                    Cancel
                </button>
            </Card>
        </div>
    )
}
