import { useMemo, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { PATHS } from '@/app/router/paths'
import { useSite, useUpdateSite, useSiteStats } from '@/modules/sites/hooks/useSites'
import { getOptimizedCloudinaryUrl } from '@/core/utils/cloudinary'
import { useChargePointsByStation } from '@/modules/charge-points/hooks/useChargePoints'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { useTenants } from '@/modules/applications/hooks/useApplications'
import { useSiteDocuments, useUploadSiteDocument, useDeleteSiteDocument } from '@/modules/sites/hooks/useSiteDocuments'
import { ROLE_GROUPS, isInGroup } from '@/constants/roles'
import { StationStatusPill } from '@/ui/components/StationStatusPill'
import { SiteEditModal } from '@/modals'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

export function SiteDetail() {
    const { id } = useParams<{ id: string }>()
    const nav = useNavigate()

    const { data: site, isLoading: loadingSite, error: siteError } = useSite(id!)
    const { data: stats, isLoading: loadingStats } = useSiteStats(id!)
    const { data: chargePoints, isLoading: loadingCP } = useChargePointsByStation(id!)
    const { data: user, isLoading: loadingUser } = useMe()
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
        if (!user || !site) return false

        // Admins can manage everything
        const isAdmin = isInGroup(user.role, ROLE_GROUPS.PLATFORM_ADMINS) || user.role === 'EVZONE_OPERATOR'
        if (isAdmin) return true

        // Station Managers can manage (assuming they are assigned or have broad manager rights)
        // But per new rules, let's keep it strict: Admins OR Explicit Owner
        const isStationManager = isInGroup(user.role, ROLE_GROUPS.STATION_MANAGERS)

        // Check explicit ownership
        const isExplicitOwner = site.ownerId === user.id

        console.log('🔒 Site Permission Check:', {
            role: user.role,
            siteId: site.id,
            siteOwnerId: site.ownerId,
            userId: user.id,
            isExplicitOwner,
            isAdmin
        })

        return isAdmin || isExplicitOwner || (isStationManager && user.role === 'MANAGER')
    }, [user, site])

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

    if (loadingSite || loadingStats || loadingCP || loadingTenants || loadingUser) {
        return (
            <DashboardLayout pageTitle="Site Details">
                <div className="flex items-center justify-center h-64">
                    <TextSkeleton lines={2} centered />
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
                        {canManage && (
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
            <div className="card mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Site Photos</h2>
                    {canManage && (
                        <button className="btn text-xs" onClick={() => setIsEditModalOpen(true)}>
                            + Add Photos
                        </button>
                    )}
                </div>
                {!site.photos || site.photos.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/10">
                        <svg className="w-16 h-16 mx-auto text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-muted text-sm mb-3">No photos uploaded yet</p>
                        {canManage && (
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-subtle text-xs">Upload photos to showcase your site</p>
                                <button className="btn secondary btn-sm" onClick={() => setIsEditModalOpen(true)}>
                                    + Add Photos
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {site.photos.map((photo, index) => (
                            <div
                                key={index}
                                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border hover:border-accent transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-lg"
                                onClick={() => window.open(photo, '_blank')}
                            >
                                <img
                                    src={getOptimizedCloudinaryUrl(photo, { width: 800, quality: 'auto', format: 'auto' })}
                                    alt={`${site.name} - Photo ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                                        <span className="text-white text-sm font-medium">Photo {index + 1}</span>
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


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
                        <div className="py-8">
                            <TextSkeleton lines={2} centered />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-muted/10">
                            <svg className="w-12 h-12 mx-auto text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-muted text-sm mb-3">No documents uploaded yet</p>
                            {canManage && (
                                <button
                                    onClick={() => setShowUploadDialog(true)}
                                    className="btn secondary btn-sm"
                                >
                                    + Add Document
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-accent/10 text-accent rounded">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{doc.title || doc.fileName || 'Untitled Document'}</div>
                                            <div className="text-xs text-muted">
                                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'} • {(doc.fileSize / 1024).toFixed(0)} KB
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
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setShowUploadDialog(false)}
                            />
                            <div className="relative bg-panel border border-border-light rounded-xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                                <h3 className="text-xl font-bold text-text mb-6">Upload Document</h3>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-muted mb-1.5">Document Title</label>
                                        <input
                                            type="text"
                                            value={uploadTitle}
                                            onChange={(e) => setUploadTitle(e.target.value)}
                                            className="input w-full"
                                            placeholder="e.g., Site Inspection Report"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted mb-1.5">Select File (PDF, DOC)</label>
                                        <div className="relative">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="input w-full pr-10"
                                                accept=".pdf,.doc,.docx"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-8">
                                        <button
                                            onClick={() => setShowUploadDialog(false)}
                                            className="btn secondary flex-1"
                                            disabled={uploadDocument.isPending}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleFileUpload}
                                            disabled={!uploadTitle || !fileInputRef.current?.files?.[0] || uploadDocument.isPending}
                                            className="btn bg-accent text-white hover:bg-accent/90 flex-1 flex items-center justify-center gap-2"
                                        >
                                            {uploadDocument.isPending ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : 'Upload'}
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
