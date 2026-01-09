import { useState } from 'react'
import { TenantApplication } from '@/core/api/types'

type ApplicationDetailModalProps = {
    open: boolean
    application: TenantApplication
    onConfirm: (id: string, status: 'Approved' | 'Rejected', terms?: any) => void
    onCancel: () => void
    loading?: boolean
}

type Tab = 'applicant' | 'proposal' | 'documents' | 'terms'

export function ApplicationDetailModal({
    open,
    application,
    onConfirm,
    onCancel,
    loading = false,
}: ApplicationDetailModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('applicant')
    const [terms, setTerms] = useState({
        proposedRent: application.proposedRent || 0,
        proposedTerm: application.proposedTerm || 12,
        numberOfChargingPoints: application.numberOfChargingPoints || 2,
        totalPowerRequirement: application.totalPowerRequirement || 22,
        chargingTechnology: application.chargingTechnology || ['AC Type 2'],
        targetCustomerSegment: application.targetCustomerSegment || ['Public'],
    })

    if (!open) return null

    const handleTermsChange = (field: string, value: any) => {
        setTerms(prev => ({ ...prev, [field]: value }))
    }

    const techOptions = ['AC Type 2', 'DC CCS2', 'DC CHAdeMO', 'Tesla Supercharger']
    const segmentOptions = ['Public', 'Fleet', 'Residential', 'Workplace']

    const toggleArrayItem = (field: 'chargingTechnology' | 'targetCustomerSegment', item: string) => {
        const current = terms[field] || []
        const updated = current.includes(item)
            ? current.filter(i => i !== item)
            : [...current, item]
        handleTermsChange(field, updated)
    }

    const renderApplicantTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label className="text-xs text-muted uppercase font-semibold">Organization</label>
                    <div className="font-medium text-text">{application.organizationName}</div>
                    <div className="text-sm text-muted">{application.businessRegistrationNumber}</div>
                </div>
                <div>
                    <label className="text-xs text-muted uppercase font-semibold">Contact Person</label>
                    <div className="font-medium text-text">{application.contactPersonName}</div>
                    <div className="text-sm text-muted">{application.contactEmail}</div>
                    <div className="text-sm text-muted">{application.contactPhone}</div>
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-muted uppercase font-semibold">Address</label>
                    <div className="text-sm text-text">{application.physicalAddress}</div>
                </div>
                <div>
                    <label className="text-xs text-muted uppercase font-semibold">Website</label>
                    <div className="text-sm text-accent truncate">
                        {application.companyWebsite ? (
                            <a href={application.companyWebsite} target="_blank" rel="noopener noreferrer">{application.companyWebsite}</a>
                        ) : 'N/A'}
                    </div>
                </div>
                <div>
                    <label className="text-xs text-muted uppercase font-semibold">Experience</label>
                    <div className="text-sm text-text">{application.yearsInEVBusiness} Years</div>
                    <div className="text-xs text-muted">{application.existingStationsOperated} Stations Operated</div>
                </div>
            </div>
        </div>
    )

    const renderProposalTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-muted uppercase font-semibold">Preferred Site</label>
                    <div className="font-medium text-text">{application.siteName}</div>
                </div>
                <div>
                    <label className="text-xs text-muted uppercase font-semibold">Lease Model</label>
                    <div className="font-medium text-text">{application.preferredLeaseModel}</div>
                </div>
            </div>

            <div>
                <label className="text-xs text-muted uppercase font-semibold">Business Plan</label>
                <div className="mt-1 p-3 bg-muted/10 border border-border-light rounded-lg text-sm text-text whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {application.businessPlanSummary}
                </div>
            </div>

            {application.sustainabilityCommitments && (
                <div>
                    <label className="text-xs text-muted uppercase font-semibold">Sustainability Commitments</label>
                    <div className="mt-1 p-3 bg-muted/10 border border-border-light rounded-lg text-sm text-text whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {application.sustainabilityCommitments}
                    </div>
                </div>
            )}

            {application.additionalServices && application.additionalServices.length > 0 && (
                <div>
                    <label className="text-xs text-muted uppercase font-semibold">Additional Services</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {application.additionalServices.map(service => (
                            <span key={service} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                                {service}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    const renderDocumentsTab = () => (
        <div className="space-y-4">
            {(!application.documents || application.documents.length === 0) ? (
                <div className="text-center py-8 text-muted italic">No documents uploaded.</div>
            ) : (
                <div className="grid gap-3">
                    {application.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border border-border-light rounded-lg hover:bg-muted/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 text-accent rounded">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-text">{doc.documentType}</div>
                                    <div className="text-xs text-muted">{doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB</div>
                                </div>
                            </div>
                            <button className="text-xs text-accent hover:underline">Download</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    const renderTermsTab = () => (
        <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs p-3 rounded-lg mb-4">
                <strong>Negotiation Required:</strong> These terms will be included in the lease contract if approved.
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium mb-1">Monthly Rent ($)</label>
                    <input
                        type="number"
                        value={terms.proposedRent}
                        onChange={(e) => handleTermsChange('proposedRent', Number(e.target.value))}
                        className="input w-full"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Lease Term (Months)</label>
                    <select
                        value={terms.proposedTerm}
                        onChange={(e) => handleTermsChange('proposedTerm', Number(e.target.value))}
                        className="select w-full"
                    >
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                        <option value={24}>24 Months</option>
                        <option value={36}>36 Months</option>
                        <option value={48}>48 Months</option>
                        <option value={60}>60 Months</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Charging Points</label>
                    <input
                        type="number"
                        value={terms.numberOfChargingPoints}
                        onChange={(e) => handleTermsChange('numberOfChargingPoints', Number(e.target.value))}
                        className="input w-full"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Power Required (kW)</label>
                    <input
                        type="number"
                        value={terms.totalPowerRequirement}
                        onChange={(e) => handleTermsChange('totalPowerRequirement', Number(e.target.value))}
                        className="input w-full"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium mb-2">Charging Technology</label>
                <div className="grid grid-cols-2 gap-2">
                    {techOptions.map(tech => (
                        <label key={tech} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={terms.chargingTechnology?.includes(tech)}
                                onChange={() => toggleArrayItem('chargingTechnology', tech)}
                                className="rounded border-border"
                            />
                            {tech}
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium mb-2">Target Customer Segment</label>
                <div className="grid grid-cols-2 gap-2">
                    {segmentOptions.map(seg => (
                        <label key={seg} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={terms.targetCustomerSegment?.includes(seg)}
                                onChange={() => toggleArrayItem('targetCustomerSegment', seg)}
                                className="rounded border-border"
                            />
                            {seg}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-panel border border-border-light rounded-xl shadow-xl max-w-2xl w-full mx-4 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-border-light flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-text">Application Details</h3>
                        <p className="text-sm text-muted">ID: {application.id}</p>
                    </div>
                    <span className={`pill ${application.status === 'Approved' ? 'approved' : application.status === 'Rejected' ? 'rejected' : 'pending'}`}>
                        {application.status}
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-light px-6">
                    {(['applicant', 'proposal', 'documents', 'terms'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-accent text-accent'
                                : 'border-transparent text-muted hover:text-text'
                                }`}
                        >
                            {tab === 'terms' ? 'Commercial Terms' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'applicant' && renderApplicantTab()}
                    {activeTab === 'proposal' && renderProposalTab()}
                    {activeTab === 'documents' && renderDocumentsTab()}
                    {activeTab === 'terms' && renderTermsTab()}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border-light bg-muted/5 flex items-center justify-between">
                    <button
                        type="button"
                        className="btn secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Close
                    </button>
                    {application.status === 'Pending' && (
                        <div className="flex gap-3">
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
                                onClick={() => onConfirm(application.id, 'Approved', terms)}
                                disabled={loading}
                            >
                                Approve & Set Terms
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
