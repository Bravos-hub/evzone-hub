import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import {
    useApplication,
    useUpdateApplicationStatus,
    useGenerateLease,
    useSendLeaseForSignature,
    useUploadLease,
    useActivateTenant,
    useProposeTerms,
    useSignLease
} from '@/modules/applications/hooks/useApplications'
import { getErrorMessage } from '@/core/api/errors'
import clsx from 'clsx'
import { RevenueCalculator } from './RevenueCalculator'
import { DealConstructor } from './DealConstructor'
import { DigitalSignaturePad } from './DigitalSignaturePad'

type Tab = 'overview' | 'negotiation' | 'documents'

export function SiteApplicationDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: app, isLoading, error } = useApplication(id!)
    const [activeTab, setActiveTab] = useState<Tab>('overview')

    // Negotiation State
    const proposeTerms = useProposeTerms()
    const signLease = useSignLease()
    const [showSignaturePad, setShowSignaturePad] = useState(false)

    const updateStatus = useUpdateApplicationStatus()
    const generateLease = useGenerateLease()
    const sendForSignature = useSendLeaseForSignature()
    const uploadLease = useUploadLease()
    const activateTenant = useActivateTenant()

    if (isLoading) return <DashboardLayout pageTitle="Loading..."><div className="p-12 text-center text-muted">Loading application data...</div></DashboardLayout>
    if (error || !app) return <DashboardLayout pageTitle="Error"><div className="p-12 text-center text-red-500">Failed to load application</div></DashboardLayout>

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700'
            case 'REJECTED': return 'bg-red-100 text-red-700'
            case 'NEGOTIATING': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'TERMS_AGREED': return 'bg-blue-100 text-blue-700'
            case 'LEASE_SIGNED': return 'bg-indigo-100 text-indigo-700'
            case 'PENDING_REVIEW': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const handleStatusChange = (status: any, message?: string) => {
        if (!app?.id) return
        updateStatus.mutate({ id: app.id, data: { status, message } })
    }

    return (
        <DashboardLayout pageTitle={`Application: ${app.operator?.name || 'Unknown Operator'}`}>

            {/* Header Card */}
            <div className="card mb-6 p-6 border-l-4 border-l-accent">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-text">{app.site?.name || 'Unknown Site'}</h1>
                            <span className={clsx("px-3 py-1 rounded-full text-xs font-bold uppercase border", getStatusColor(app.status))}>
                                {app.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-muted flex items-center gap-2">
                            <span>Submitted by <strong className="text-text">{app.operator?.name}</strong></span>
                            <span>•</span>
                            <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {app.status === 'PENDING_REVIEW' && (
                            <>
                                <button
                                    className="btn bg-white border border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => handleStatusChange('REJECTED', 'Application rejected by owner')}
                                    disabled={updateStatus.isPending}
                                >
                                    Reject
                                </button>
                                <button
                                    className="btn primary"
                                    onClick={() => handleStatusChange('NEGOTIATING', 'Negotiation started')}
                                    disabled={updateStatus.isPending}
                                >
                                    Start Negotiation
                                </button>
                            </>
                        )}

                        {app.status === 'NEGOTIATING' && (
                            <button
                                className="btn bg-green-600 text-white hover:bg-green-700"
                                onClick={() => handleStatusChange('TERMS_AGREED', 'Terms accepted by owner')}
                                disabled={updateStatus.isPending}
                            >
                                Accep Terms & Approve
                            </button>
                        )}

                        {app.status === 'TERMS_AGREED' && (
                            <button
                                className="btn primary"
                                onClick={() => setActiveTab('documents')}
                            >
                                Manage Lease
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-white/10">
                {(['overview', 'negotiation', 'documents'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                            "px-6 py-3 font-medium text-sm transition-colors border-b-2 relative top-[2px]",
                            activeTab === tab
                                ? "border-accent text-accent bg-accent/5 rounded-t-lg"
                                : "border-transparent text-muted hover:text-text hover:bg-white/5 rounded-t-lg"
                        )}
                    >
                        {tab === 'negotiation' && app.status === 'NEGOTIATING' && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid gap-6 animate-in fade-in duration-300">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="card p-6">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="p-1.5 bg-accent/10 text-accent rounded-lg">📋</span>
                                    Proposed Terms
                                </h3>
                                {app.proposedTerms ? (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs text-muted uppercase tracking-wider">Monthly Rent</label>
                                                <div className="text-2xl font-bold text-text">${app.proposedTerms.monthlyRent.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted uppercase tracking-wider">Lease Duration</label>
                                                <div className="text-lg font-medium">{app.proposedTerms.leaseDuration} Months</div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs text-muted uppercase tracking-wider">Revenue Share</label>
                                                <div className="text-lg font-medium">{app.proposedTerms.revenueSharePercent || 0}%</div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted uppercase tracking-wider">Utilities</label>
                                                <div className="text-lg font-medium">{app.proposedTerms.utilitiesResponsibility}</div>
                                            </div>
                                        </div>

                                        {app.proposedTerms.customClauses && app.proposedTerms.customClauses.length > 0 && (
                                            <div className="col-span-2 mt-4 pt-4 border-t border-white/5">
                                                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Custom Clauses</label>
                                                <ul className="list-disc list-inside text-sm text-dim space-y-1">
                                                    {app.proposedTerms.customClauses.map((clause, i) => (
                                                        <li key={i}>{clause}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-muted italic">No specific terms proposed.</p>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <div className="card p-6">
                                <h3 className="font-bold text-sm mb-4 text-muted uppercase tracking-wider">Applicant</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                                        {app.operator?.name?.charAt(0) || 'O'}
                                    </div>
                                    <div>
                                        <div className="font-bold">{app.operator?.name || 'N/A'}</div>
                                        <div className="text-xs text-muted">Operator</div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Email</span>
                                        <span className="text-text">{app.operator?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Verified</span>
                                        <span className="text-green-500 font-bold">Yes</span>
                                    </div>
                                </div>

                                <button className="btn w-full mt-6 bg-white/5 hover:bg-white/10 border-white/5">
                                    Message Applicant
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'negotiation' && (
                    <div className="space-y-6">
                        <div className="card border-2 border-dashed border-white/10 bg-white/5">
                            <div className="p-6 border-b border-white/10 text-center">
                                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                </div>
                                <h3 className="text-lg font-bold mb-2">Deal Constructor</h3>
                                <p className="text-muted max-w-lg mx-auto">
                                    Use the tools below to structure a counter-offer. You can modify the rent, duration, responsibilities, and add custom clauses.
                                </p>
                            </div>

                            <div className="p-6">
                                <DealConstructor
                                    initialTerms={app.proposedTerms}
                                    onSave={(terms, message) => {
                                        if (app.id) {
                                            proposeTerms.mutate({
                                                applicationId: app.id,
                                                terms,
                                                message: message || 'Counter offer proposed by site owner'
                                            })
                                        }
                                    }}
                                    isSubmitting={proposeTerms.isPending}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card p-6">
                            <h3 className="font-bold text-lg mb-4">Draft Lease</h3>

                            {!app.leaseAgreementUrl ? (
                                <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg bg-white/5">
                                    <div className="text-4xl mb-3">📄</div>
                                    <h4 className="font-bold mb-2">No Lease Generated</h4>
                                    <p className="text-muted text-sm mb-4">Generate a standard lease based on the agreed terms.</p>
                                    <button
                                        className="btn primary"
                                        onClick={() => generateLease.mutate(app.id)}
                                        disabled={generateLease.isPending}
                                    >
                                        {generateLease.isPending ? 'Generating...' : 'Generate New Lease'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 rounded-lg bg-blue-50/5 border border-blue-500/20 mb-4">
                                        <p className="text-sm text-blue-200">
                                            {app.leaseSignedAt
                                                ? `Lease signed on ${new Date(app.leaseSignedAt).toLocaleDateString()}`
                                                : 'A standard lease agreement has been generated based on the agreed terms.'}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">📄</span>
                                                <div>
                                                    <div className="font-medium">Lease_Agreement.pdf</div>
                                                    <div className="text-xs text-muted">
                                                        {app.leaseSignedAt ? 'Signed Document' : 'Draft Version'}
                                                    </div>
                                                </div>
                                            </div>
                                            <a
                                                href={app.leaseAgreementUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-accent hover:underline text-sm font-medium"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    </div>

                                    {!app.leaseSignedAt && (
                                        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3">
                                            <div className="flex gap-3">
                                                <button
                                                    className="btn secondary flex-1 relative"
                                                    disabled={uploadLease.isPending}
                                                >
                                                    {uploadLease.isPending ? 'Uploading...' : 'Upload Signed Copy'}
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        accept=".pdf"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file && app.id) {
                                                                uploadLease.mutate({ id: app.id, file })
                                                            }
                                                        }}
                                                    />
                                                </button>
                                                <button
                                                    className="btn primary flex-1"
                                                    onClick={() => sendForSignature.mutate(app.id)}
                                                    disabled={sendForSignature.isPending}
                                                >
                                                    {sendForSignature.isPending ? 'Sending...' : 'Send for E-Signature'}
                                                </button>
                                            </div>
                                            <p className="text-xs text-center text-muted">
                                                Sending for signature will email the operator a link to sign digitally.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className={clsx("card p-6", !app.leaseSignedAt && "opacity-50")}>
                            <h3 className="font-bold text-lg mb-4">Security Deposit</h3>
                            {!app.leaseSignedAt ? (
                                <p className="text-muted text-sm">Security deposit verification will be enabled once the lease is signed.</p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                        <span className="text-sm font-medium">Required Amount</span>
                                        <span className="text-lg font-bold">${(app.negotiatedTerms?.securityDepositMonths || 0) * (app.negotiatedTerms?.monthlyRent || 0)}</span>
                                    </div>

                                    {app.status === 'LEASE_SIGNED' || app.status === 'AWAITING_DEPOSIT' ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-muted">Please verify that you have received the security deposit from the operator.</p>
                                            <button
                                                className="btn primary w-full"
                                                onClick={() => handleStatusChange('DEPOSIT_PAID', 'Security deposit verified by owner')}
                                                disabled={updateStatus.isPending}
                                            >
                                                {updateStatus.isPending ? 'Verifying...' : 'Confirm Deposit Received'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg flex items-center gap-2">
                                                <span className="text-xl">✓</span>
                                                <span className="font-medium">Deposit Verified</span>
                                            </div>

                                            {app.status === 'DEPOSIT_PAID' && (
                                                <div className="pt-4 border-t border-white/5">
                                                    <h4 className="font-bold mb-2">Final Activation</h4>
                                                    <p className="text-sm text-muted mb-4">
                                                        The lease is signed and deposit collected. Activate the tenant to grant them access to the site.
                                                    </p>
                                                    <button
                                                        className="btn primary w-full"
                                                        onClick={() => activateTenant.mutate(app.id)}
                                                        disabled={activateTenant.isPending}
                                                    >
                                                        {activateTenant.isPending ? 'Activating...' : 'Activate Tenant & Handover'}
                                                    </button>
                                                </div>
                                            )}

                                            {app.status === 'COMPLETED' && (
                                                <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg text-center">
                                                    <h4 className="font-bold text-accent mb-1">Active Tenant</h4>
                                                    <p className="text-sm text-accent/80">This tenant is now fully onboarded and managing the site.</p>
                                                    <button
                                                        className="btn secondary btn-sm mt-3"
                                                        onClick={() => navigate(`/site-owner/tenants/${app.tenantId || ''}`)}
                                                    >
                                                        View Tenant Dashboard
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>



            {/* Digital Signature Pad Modal */}
            {
                showSignaturePad && (
                    <DigitalSignaturePad
                        signeeName="Site Owner" // In real app, get from user profile
                        onSign={(signatureData) => {
                            if (app.id) {
                                signLease.mutate({ id: app.id, signatureData }, {
                                    onSuccess: () => setShowSignaturePad(false)
                                })
                            }
                        }}
                        onCancel={() => setShowSignaturePad(false)}
                        isSubmitting={signLease.isPending}
                    />
                )
            }

        </DashboardLayout >
    )
}
