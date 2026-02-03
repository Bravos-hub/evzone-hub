import { useState } from 'react'
import { usePendingApplications, useApproveApplication, useRejectApplication, type UserApplication } from '../hooks/useApplications'
import { formatDistanceToNow } from 'date-fns'

export function PendingApplications() {
    const { data: applications, isLoading } = usePendingApplications()
    const [selectedApp, setSelectedApp] = useState<UserApplication | null>(null)

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-2 text-sm text-text-secondary">Loading applications...</p>
            </div>
        )
    }

    if (!applications || applications.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-panel p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-text">No pending applications</h3>
                <p className="mt-2 text-sm text-text-secondary">All user registrations have been processed.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text">Pending Applications</h2>
                    <p className="text-sm text-text-secondary">{applications.length} application{applications.length !== 1 ? 's' : ''} awaiting review</p>
                </div>
            </div>

            <div className="grid gap-4">
                {applications.map((app) => (
                    <div
                        key={app.id}
                        className="rounded-lg border border-border bg-panel p-5 transition-colors hover:bg-panel-2 cursor-pointer"
                        onClick={() => setSelectedApp(app)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold">
                                        {app.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text">{app.user.name}</h3>
                                        <p className="text-sm text-text-secondary">{app.user.email}</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                    <div>
                                        <div className="text-xs font-medium text-text-secondary uppercase tracking-wide">Role</div>
                                        <div className="mt-1 text-sm text-text">{app.role.replace(/_/g, ' ')}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-text-secondary uppercase tracking-wide">Company</div>
                                        <div className="mt-1 text-sm text-text">{app.companyName || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-text-secondary uppercase tracking-wide">Region</div>
                                        <div className="mt-1 text-sm text-text">{app.region}, {app.country}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                                    Pending Review
                                </span>
                                <span className="text-xs text-text-secondary">
                                    {formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedApp && (
                <ApplicationDetailsModal
                    application={selectedApp}
                    onClose={() => setSelectedApp(null)}
                />
            )}
        </div>
    )
}

function ApplicationDetailsModal({ application, onClose }: { application: UserApplication; onClose: () => void }) {
    const approveApp = useApproveApplication()
    const rejectApp = useRejectApplication()
    const [notes, setNotes] = useState('')
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectForm, setShowRejectForm] = useState(false)

    const handleApprove = async () => {
        try {
            await approveApp.mutateAsync({ id: application.id, notes })
            onClose()
        } catch (error) {
            console.error('Failed to approve:', error)
        }
    }

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason')
            return
        }
        try {
            await rejectApp.mutateAsync({
                id: application.id,
                reason: rejectionReason,
                notes,
            })
            onClose()
        } catch (error) {
            console.error('Failed to reject:', error)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="w-full max-w-2xl rounded-xl border border-border bg-surface shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="border-b border-border p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-text">Application Review</h3>
                            <p className="text-sm text-text-secondary mt-1">Review user registration details</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 hover:bg-panel transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
                    {/* User Info */}
                    <div>
                        <h4 className="text-sm font-semibold text-text mb-3">User Information</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <div className="text-xs text-text-secondary">Name</div>
                                <div className="text-sm text-text font-medium">{application.user.name}</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-secondary">Email</div>
                                <div className="text-sm text-text font-medium">{application.user.email}</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-secondary">Phone</div>
                                <div className="text-sm text-text font-medium">{application.user.phone || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-secondary">Registered</div>
                                <div className="text-sm text-text font-medium">
                                    {formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div>
                        <h4 className="text-sm font-semibold text-text mb-3">Company Details</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <div className="text-xs text-text-secondary">Company Name</div>
                                <div className="text-sm text-text font-medium">{application.companyName || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-secondary">Tax ID</div>
                                <div className="text-sm text-text font-medium">{application.taxId || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-secondary">Account Type</div>
                                <div className="text-sm text-text font-medium">{application.accountType}</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-secondary">Location</div>
                                <div className="text-sm text-text font-medium">{application.region}, {application.country}</div>
                            </div>
                        </div>
                    </div>

                    {/* Role & Plan */}
                    <div>
                        <h4 className="text-sm font-semibold text-text mb-3">Access Details</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <div className="text-xs text-text-secondary">Role</div>
                                <div className="text-sm text-text font-medium">{application.role.replace(/_/g, ' ')}</div>
                            </div>
                            <div>
                                <div className="text-xs text-text-secondary">Subscribed Package</div>
                                <div className="text-sm text-text font-medium">{application.subscribedPackage || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    {application.documents && application.documents.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-text mb-3">Documents</h4>
                            <div className="space-y-2">
                                {application.documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-panel p-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <div>
                                                <div className="text-sm font-medium text-text">{doc.name || doc.type}</div>
                                                <div className="text-xs text-text-secondary">{doc.type}</div>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-accent hover:underline"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                        <label className="text-sm font-semibold text-text block mb-2">Admin Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
                            rows={3}
                            placeholder="Add any notes about this review..."
                        />
                    </div>

                    {/* Rejection Form */}
                    {showRejectForm && (
                        <div>
                            <label className="text-sm font-semibold text-text block mb-2">Rejection Reason *</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-danger"
                                rows={3}
                                placeholder="Explain why this application is being rejected..."
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border p-6 flex items-center justify-end gap-3">
                    {!showRejectForm ? (
                        <>
                            <button
                                onClick={() => setShowRejectForm(true)}
                                className="px-4 py-2 rounded-lg border border-border bg-panel hover:bg-panel-2 text-danger text-sm font-medium transition-colors"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={approveApp.isPending}
                                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {approveApp.isPending ? 'Approving...' : 'Approve Application'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setShowRejectForm(false)
                                    setRejectionReason('')
                                }}
                                className="px-4 py-2 rounded-lg border border-border bg-panel hover:bg-panel-2 text-text text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejectApp.isPending || !rejectionReason.trim()}
                                className="px-4 py-2 rounded-lg bg-danger hover:bg-danger/90 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {rejectApp.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
