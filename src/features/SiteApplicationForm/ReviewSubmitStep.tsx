import { useState } from 'react'

interface ReviewSubmitStepProps {
    data: any
    documents: any[]
    onBack: () => void
    onSubmit: () => void
    isSubmitting: boolean
}

export function ReviewSubmitStep({ data, documents, onBack, onSubmit, isSubmitting }: ReviewSubmitStepProps) {
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    const handleSubmit = () => {
        if (!agreedToTerms) {
            alert('Please agree to the terms and conditions before submitting')
            return
        }
        onSubmit()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-4">Review & Submit</h2>
                <p className="text-muted text-sm">Please review your application before submitting</p>
            </div>

            {/* Organization Details */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Organization Details</h3>
                <div className="bg-muted/10 rounded-lg p-4 space-y-2">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-muted">Organization Name</div>
                            <div className="text-sm font-medium">{data.organizationName}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted">Business Registration Number</div>
                            <div className="text-sm font-medium">{data.businessRegistrationNumber}</div>
                        </div>
                        {data.taxComplianceNumber && (
                            <div>
                                <div className="text-xs text-muted">Tax Compliance Number</div>
                                <div className="text-sm font-medium">{data.taxComplianceNumber}</div>
                            </div>
                        )}
                        {data.companyWebsite && (
                            <div>
                                <div className="text-xs text-muted">Website</div>
                                <div className="text-sm font-medium">{data.companyWebsite}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Contact Information</h3>
                <div className="bg-muted/10 rounded-lg p-4 space-y-2">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-muted">Contact Person</div>
                            <div className="text-sm font-medium">{data.contactPersonName}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted">Email</div>
                            <div className="text-sm font-medium">{data.contactEmail}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted">Phone</div>
                            <div className="text-sm font-medium">{data.contactPhone}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted">Address</div>
                            <div className="text-sm font-medium">{data.physicalAddress}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Experience */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Business Experience</h3>
                <div className="bg-muted/10 rounded-lg p-4 space-y-2">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-muted">Years in EV Business</div>
                            <div className="text-sm font-medium">{data.yearsInEVBusiness}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted">Existing Stations Operated</div>
                            <div className="text-sm font-medium">{data.existingStationsOperated}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Site & Proposal */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Site & Proposal</h3>
                <div className="bg-muted/10 rounded-lg p-4 space-y-3">
                    <div>
                        <div className="text-xs text-muted">Preferred Lease Model</div>
                        <div className="text-sm font-medium">{data.preferredLeaseModel}</div>
                    </div>
                    {data.estimatedStartDate && (
                        <div>
                            <div className="text-xs text-muted">Estimated Start Date</div>
                            <div className="text-sm font-medium">{new Date(data.estimatedStartDate).toLocaleDateString()}</div>
                        </div>
                    )}
                    <div>
                        <div className="text-xs text-muted mb-1">Business Plan Summary</div>
                        <div className="text-sm text-text/80 whitespace-pre-wrap">{data.businessPlanSummary}</div>
                    </div>
                    {data.sustainabilityCommitments && (
                        <div>
                            <div className="text-xs text-muted mb-1">Sustainability Commitments</div>
                            <div className="text-sm text-text/80 whitespace-pre-wrap">{data.sustainabilityCommitments}</div>
                        </div>
                    )}
                    {data.additionalServices && data.additionalServices.length > 0 && (
                        <div>
                            <div className="text-xs text-muted mb-1">Additional Services</div>
                            <div className="flex flex-wrap gap-2">
                                {data.additionalServices.map((service: string) => (
                                    <span key={service} className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                                        {service}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {data.message && (
                        <div>
                            <div className="text-xs text-muted mb-1">Additional Message</div>
                            <div className="text-sm text-text/80 whitespace-pre-wrap">{data.message}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Documents */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Uploaded Documents</h3>
                <div className="bg-muted/10 rounded-lg p-4">
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="font-medium">{doc.documentType}</span>
                                    {doc.required && (
                                        <span className="text-xs px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded">Required</span>
                                    )}
                                </div>
                                <span className="text-xs text-muted">{doc.fileName}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted">
                        Total: {documents.length} documents uploaded
                    </div>
                </div>
            </div>

            {/* Terms & Conditions */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 rounded border-border"
                    />
                    <div className="text-sm">
                        <div className="font-medium">Terms & Conditions</div>
                        <div className="text-muted mt-1">
                            I confirm that all information provided is accurate and complete. I understand that the site owner will review this application and set commercial terms (rent, lease duration, charging points, etc.) during the approval process. I agree to the EVZONE platform terms and conditions.
                        </div>
                    </div>
                </label>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t border-border">
                <button type="button" onClick={onBack} className="btn secondary px-6" disabled={isSubmitting}>
                    ← Back
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn px-8"
                    disabled={!agreedToTerms || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Submitting...
                        </>
                    ) : (
                        'Submit Application'
                    )}
                </button>
            </div>
        </div>
    )
}
