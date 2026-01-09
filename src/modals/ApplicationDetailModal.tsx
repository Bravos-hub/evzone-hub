import { TenantApplication } from '@/core/api/types'

type ApplicationDetailModalProps = {
    open: boolean
    application: TenantApplication
    onConfirm: (id: string, status: 'Approved' | 'Rejected') => void
    onCancel: () => void
    loading?: boolean
}

export function ApplicationDetailModal({
    open,
    application,
    onConfirm,
    onCancel,
    loading = false,
}: ApplicationDetailModalProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-panel border border-border-light rounded-xl p-6 shadow-xl max-w-lg w-full mx-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-text">Application Details</h3>
                    <span className={`pill ${application.status === 'Approved' ? 'approved' : application.status === 'Rejected' ? 'rejected' : 'pending'}`}>
                        {application.status}
                    </span>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted uppercase font-semibold">Applicant</label>
                            <div className="text-sm font-bold text-text">{application.applicantName}</div>
                            <div className="text-xs text-muted">{application.organizationName}</div>
                        </div>
                        <div>
                            <label className="text-xs text-muted uppercase font-semibold">Site</label>
                            <div className="text-sm font-bold text-text">{application.siteName}</div>
                            <div className="text-xs text-muted">ID: {application.siteId}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted uppercase font-semibold">Proposed Rent</label>
                            <div className="text-lg font-bold text-ok">${application.proposedRent?.toLocaleString()} / mo</div>
                        </div>
                        <div>
                            <label className="text-xs text-muted uppercase font-semibold">Lease Term</label>
                            <div className="text-lg font-bold">{application.proposedTerm} Months</div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-muted uppercase font-semibold">Message</label>
                        <div className="mt-1 p-3 bg-muted/10 border border-border-light rounded-lg text-sm italic text-muted leading-relaxed">
                            "{application.message || 'No additional message provided.'}"
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border-light flex items-center justify-between">
                        <div className="text-xs text-muted">
                            Submitted on {new Date(application.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="btn secondary"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Close
                            </button>
                            {application.status === 'Pending' && (
                                <>
                                    <button
                                        type="button"
                                        className="btn bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                        onClick={() => onConfirm(application.id, 'Rejected')}
                                        disabled={loading}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        className="btn bg-ok text-white hover:bg-ok/90"
                                        onClick={() => onConfirm(application.id, 'Approved')}
                                        disabled={loading}
                                    >
                                        Approve Application
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
