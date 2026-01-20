import { useMemo, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { PATHS } from '@/app/router/paths'
import { useSite, useUpdateSite } from '@/core/api/hooks/useSites'
import { useStationStats } from '@/core/api/hooks/useStations'
import { useChargePointsByStation } from '@/core/api/hooks/useChargePoints'
import { useMe } from '@/core/api/hooks/useAuth'
import { useTenants } from '@/core/api/hooks/useTenants'
import { useSiteDocuments, useUploadSiteDocument, useDeleteSiteDocument } from '@/core/api/hooks/useSiteDocuments'
import { ROLE_GROUPS, isInGroup } from '@/constants/roles'
import { StationStatusPill } from '@/ui/components/StationStatusPill'
import { SiteEditModal } from '@/modals'

export function SiteDetail() {
    const { id } = useParams<{ id: string }>()
    const nav = useNavigate()

    const { data: site, isLoading: loadingSite, error: siteError } = useSite(id!)
    const { data: stats, isLoading: loadingStats } = useStationStats(id!)
    const { data: chargePoints, isLoading: loadingCP } = useChargePointsByStation(id!)
    const { data: user } = useMe()
    const { data: tenants, isLoading: loadingTenants } = useTenants({ siteId: id })

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [uploadTitle, setUploadTitle] = useState('')
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const updateSite = useUpdateSite()
    const { data: documents = [], isLoading: loadingDocs } = useSiteDocuments(id!)
    const uploadDocument = useUploadSiteDocument()
    const deleteDocument = useDeleteSiteDocument()

    const canManage = useMemo(() => {
        if (!user) return false
        return isInGroup(user.role, ROLE_GROUPS.PLATFORM_ADMINS) ||
            isInGroup(user.role, ROLE_GROUPS.STATION_MANAGERS) ||
            user.role === 'SITE_OWNER'
    }, [user])

    const handleFileUpload = async () => {
        const file = fileInputRef.current?.files?.[0]
        if (!file || !uploadTitle) return

        await uploadDocument.mutateAsync({
            siteId: id!,
            title: uploadTitle,
            file
        })

        setShowUploadDialog(false)
        setUploadTitle('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    if (loadingSite || loadingStats || loadingCP || loadingTenants) {
        return (
            <DashboardLayout pageTitle="Site Details">
                <div className="flex items-center justify-center h-64">
                    <div className="text-subtle">Loading site details...</div>
                </div>
            </DashboardLayout>
        )
    }

    if (siteError || !site) {
        return (
            <DashboardLayout pageTitle="Site Details">
                <div className="p-8 text-center text-red-500">
                    Failed to load site details. It may not exist.
                </div>
            </DashboardLayout>
        )
    }

    // Map stats safely
    const stationStats = stats as any || {
        totalRevenue: 0,
        totalSessions: 0,
        totalEnergy: 0,
        averageSessionDuration: 0
    }

    return (
        <DashboardLayout pageTitle="Site Details">
            <div className="mb-6">
                <Link to={PATHS.SITE_OWNER.SITES} className="text-sm text-subtle hover:text-text mb-2 inline-block">← Back to My Sites</Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{site.name}</h1>
                        <p className="text-muted">{site.address}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`pill ${site.status === 'ACTIVE' ? 'approved' : site.status === 'MAINTENANCE' ? 'active' : 'declined'} text-lg px-4 py-1`}>
                            {site.status}
                        </span>
                        {user?.role === 'SITE_OWNER' && (
                            <button
                                className="btn secondary"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                Edit Site
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Site Photos Gallery */}
            {site.photos && site.photos.length > 0 && (
                <div className="card mb-6">
                    <h2 className="text-xl font-bold mb-4">Site Photos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {site.photos.map((photo, index) => (
                            <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border hover:border-accent transition-colors group cursor-pointer">
                                <img
                                    src={photo}
                                    alt={`${site.name} - Photo ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onClick={() => window.open(photo, '_blank')}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                    <span className="text-white text-sm font-medium">View Full Size</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card">
                    <div className="text-xs text-muted mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-ok">${(stationStats.totalRevenue || 0).toLocaleString()}</div>
                </div>
                <div className="card">
                    <div className="text-xs text-muted mb-1">Total Sessions</div>
                    <div className="text-2xl font-bold text-accent">{stationStats.totalSessions || 0}</div>
                </div>
                <div className="card">
                    <div className="text-xs text-muted mb-1">Power Capacity</div>
                    <div className="text-2xl font-bold">{site.powerCapacityKw || 0} kW</div>
                </div>
                <div className="card">
                    <div className="text-xs text-muted mb-1">Total Energy</div>
                    <div className="text-2xl font-bold">{(stationStats.totalEnergy || 0).toLocaleString()} kWh</div>
                </div>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold mb-4">Installed Chargers</h2>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Charger ID</th>
                                <th>Model</th>
                                <th>Max Power</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!chargePoints || chargePoints.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-subtle">No chargers installed at this site.</td>
                                </tr>
                            ) : (
                                chargePoints.map(c => (
                                    <tr key={c.id}>
                                        <td className="font-semibold">{c.id}</td>
                                        <td>{c.model}</td>
                                        <td>{c.connectors?.reduce((max, conn) => Math.max(max, conn.maxPowerKw), 0) || 0} kW</td>
                                        <td>
                                            <span className={`pill ${c.status === 'Online' ? 'approved' :
                                                c.status === 'Offline' ? 'declined' :
                                                    'active'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            {canManage ? (
                                                <button
                                                    className="btn secondary text-xs font-bold"
                                                    onClick={() => nav(PATHS.STATIONS.CHARGE_POINT_DETAIL(c.id))}
                                                >
                                                    Manage
                                                </button>
                                            ) : (
                                                <span className="text-xs text-muted italic">View Only</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Lease & Contract Section */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-4">Lease & Contract Details</h2>
                    {!tenants || tenants.length === 0 ? (
                        <div className="text-sm text-subtle py-4">No active lease information found for this site.</div>
                    ) : (
                        <div className="space-y-4">
                            {tenants.map((t: any) => (
                                <div key={t.id} className="p-3 bg-muted/20 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-sm font-bold">{t.name}</div>
                                            <div className="text-xs text-muted">{t.type} • {t.model}</div>
                                        </div>
                                        <span className={`pill ${t.status === 'Active' ? 'approved' : 'pending'} text-xs`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm mt-3 border-t border-border pt-2">
                                        <div>
                                            <div className="text-xs text-muted uppercase">Terms</div>
                                            <div>{t.terms}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted uppercase">Started</div>
                                            <div>{t.startDate}</div>
                                        </div>
                                        {t.nextPaymentDue && (
                                            <div className="col-span-2 pt-2">
                                                <div className="text-xs text-muted uppercase">Next Payout</div>
                                                <div className="text-ok font-bold">${t.nextPaymentDue.amount.toLocaleString()} on {t.nextPaymentDue.date}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Site Documentation Section */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Site Documentation</h2>
                        {canManage && (
                            <button
                                onClick={() => setShowUploadDialog(true)}
                                className="btn text-xs"
                            >
                                + Upload Document
                            </button>
                        )}
                    </div>

                    {loadingDocs ? (
                        <div className="text-sm text-subtle py-4">Loading documents...</div>
                    ) : documents.length === 0 ? (
                        <div className="text-sm text-subtle py-4">No documents uploaded yet.</div>
                    ) : (
                        <div className="space-y-2">
                            {documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-accent/10 text-accent rounded">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{doc.title}</div>
                                            <div className="text-xs text-muted">
                                                {new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.fileSize / 1024).toFixed(0)} KB
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => window.open(doc.fileUrl, '_blank')}
                                            className="text-accent opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-accent/10 rounded-full"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </button>
                                        {canManage && (
                                            <button
                                                onClick={() => deleteDocument.mutate({ siteId: id!, documentId: doc.id })}
                                                className="text-danger opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-danger/10 rounded-full"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload Dialog */}
                    {showUploadDialog && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUploadDialog(false)}>
                            <div className="bg-surface rounded-xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-bold mb-4">Upload Document</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Document Title</label>
                                        <input
                                            type="text"
                                            value={uploadTitle}
                                            onChange={(e) => setUploadTitle(e.target.value)}
                                            className="input w-full"
                                            placeholder="e.g., Site Inspection Report"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Select File</label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="input w-full"
                                            accept=".pdf,.doc,.docx"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowUploadDialog(false)}
                                            className="btn secondary flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleFileUpload}
                                            disabled={!uploadTitle || !fileInputRef.current?.files?.[0]}
                                            className="btn flex-1"
                                        >
                                            Upload
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {site && (
                <SiteEditModal
                    open={isEditModalOpen}
                    site={site}
                    loading={updateSite.isPending}
                    onCancel={() => setIsEditModalOpen(false)}
                    onConfirm={(data) => {
                        updateSite.mutate({ id: site.id, data }, {
                            onSuccess: () => setIsEditModalOpen(false)
                        })
                    }}
                />
            )}
        </DashboardLayout>
    )
}
