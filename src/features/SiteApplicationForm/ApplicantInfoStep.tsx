interface ApplicantInfoStepProps {
    data: any
    onChange: (updates: any) => void
    onNext: () => void
}

export function ApplicantInfoStep({ data, onChange, onNext }: ApplicantInfoStepProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validate required fields
        if (!data.organizationName || !data.businessRegistrationNumber || !data.contactPersonName || !data.contactEmail || !data.contactPhone || !data.physicalAddress) {
            alert('Please fill in all required fields')
            return
        }

        onNext()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-4">Applicant Information</h2>
                <p className="text-muted text-sm">Provide your organization and contact details</p>
            </div>

            {/* Organization Details */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Organization Details</h3>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Organization Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.organizationName}
                            onChange={(e) => onChange({ organizationName: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., QuickCharge Co"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Business Registration Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.businessRegistrationNumber}
                            onChange={(e) => onChange({ businessRegistrationNumber: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., BRN-2023-001"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Tax Compliance Number
                        </label>
                        <input
                            type="text"
                            value={data.taxComplianceNumber}
                            onChange={(e) => onChange({ taxComplianceNumber: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., TAX-QC-2023"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Company Website
                        </label>
                        <input
                            type="url"
                            value={data.companyWebsite}
                            onChange={(e) => onChange({ companyWebsite: e.target.value })}
                            className="input w-full"
                            placeholder="https://example.com"
                        />
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Contact Information</h3>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Contact Person Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.contactPersonName}
                            onChange={(e) => onChange({ contactPersonName: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={data.contactEmail}
                            onChange={(e) => onChange({ contactEmail: e.target.value })}
                            className="input w-full"
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={data.contactPhone}
                            onChange={(e) => onChange({ contactPhone: e.target.value })}
                            className="input w-full"
                            placeholder="+256-700-123456"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Physical Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.physicalAddress}
                            onChange={(e) => onChange({ physicalAddress: e.target.value })}
                            className="input w-full"
                            placeholder="123 Business Park, Kampala"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Business Experience */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Business Experience</h3>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Years in EV Charging Business <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.yearsInEVBusiness}
                            onChange={(e) => onChange({ yearsInEVBusiness: e.target.value })}
                            className="select w-full"
                            required
                        >
                            <option value="<1">Less than 1 year</option>
                            <option value="1-3">1-3 years</option>
                            <option value="3-5">3-5 years</option>
                            <option value="5+">5+ years</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Existing Stations Operated
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={data.existingStationsOperated}
                            onChange={(e) => onChange({ existingStationsOperated: parseInt(e.target.value) || 0 })}
                            className="input w-full"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="submit" className="btn px-6">
                    Next Step →
                </button>
            </div>
        </form>
    )
}
