import { useStations } from '@/core/api/hooks/useStations'

interface SiteSelectionStepProps {
    data: any
    onChange: (updates: any) => void
    onNext: () => void
    onBack: () => void
}

export function SiteSelectionStep({ data, onChange, onNext, onBack }: SiteSelectionStepProps) {
    const { data: stations, isLoading } = useStations()
    const availableSites = stations || []

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!data.siteId || !data.businessPlanSummary) {
            alert('Please select a site and provide a business plan summary')
            return
        }

        onNext()
    }

    const additionalServicesOptions = [
        'EV Maintenance',
        'Retail',
        'Food & Beverage',
        'Car Wash',
        'Waiting Lounge'
    ]

    const toggleService = (service: string) => {
        const current = data.additionalServices || []
        if (current.includes(service)) {
            onChange({ additionalServices: current.filter((s: string) => s !== service) })
        } else {
            onChange({ additionalServices: [...current, service] })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-4">Site Selection & Business Proposal</h2>
                <p className="text-muted text-sm">Select your preferred site and describe your business plan</p>
            </div>

            {/* Site Selection */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Site Selection</h3>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Select Site <span className="text-red-500">*</span>
                    </label>
                    {isLoading ? (
                        <div className="text-sm text-muted">Loading available sites...</div>
                    ) : (
                        <select
                            value={data.siteId}
                            onChange={(e) => onChange({ siteId: e.target.value })}
                            className="select w-full"
                            required
                        >
                            <option value="">-- Select a site --</option>
                            {availableSites.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.name} - {site.address}
                                </option>
                            ))}
                        </select>
                    )}
                    <p className="text-xs text-muted mt-1">Choose the site where you'd like to operate charging stations</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Preferred Lease Model <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={data.preferredLeaseModel}
                        onChange={(e) => onChange({ preferredLeaseModel: e.target.value })}
                        className="select w-full"
                        required
                    >
                        <option value="Revenue Share">Revenue Share</option>
                        <option value="Fixed Rent">Fixed Rent</option>
                        <option value="Hybrid">Hybrid (Revenue Share + Fixed)</option>
                    </select>
                    <p className="text-xs text-muted mt-1">Note: Final terms will be negotiated with the site owner</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Estimated Start Date
                    </label>
                    <input
                        type="date"
                        value={data.estimatedStartDate}
                        onChange={(e) => onChange({ estimatedStartDate: e.target.value })}
                        className="input w-full"
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>

            {/* Business Proposal */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">Business Proposal</h3>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Business Plan Summary <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={data.businessPlanSummary}
                        onChange={(e) => onChange({ businessPlanSummary: e.target.value })}
                        className="input w-full"
                        rows={6}
                        placeholder="Describe your business plan, revenue projections, customer acquisition strategy, and competitive advantage (max 500 words)"
                        maxLength={3000}
                        required
                    />
                    <p className="text-xs text-muted mt-1">{data.businessPlanSummary.length} / 3000 characters</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Sustainability Commitments
                    </label>
                    <textarea
                        value={data.sustainabilityCommitments}
                        onChange={(e) => onChange({ sustainabilityCommitments: e.target.value })}
                        className="input w-full"
                        rows={4}
                        placeholder="Describe your environmental commitments, renewable energy usage, recycling plans, etc. (max 250 words)"
                        maxLength={1500}
                    />
                    <p className="text-xs text-muted mt-1">{data.sustainabilityCommitments.length} / 1500 characters</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Additional Services Offered
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {additionalServicesOptions.map((service) => (
                            <label key={service} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(data.additionalServices || []).includes(service)}
                                    onChange={() => toggleService(service)}
                                    className="rounded border-border"
                                />
                                <span className="text-sm">{service}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Additional Message
                    </label>
                    <textarea
                        value={data.message}
                        onChange={(e) => onChange({ message: e.target.value })}
                        className="input w-full"
                        rows={3}
                        placeholder="Any additional information you'd like to share with the site owner"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t border-border">
                <button type="button" onClick={onBack} className="btn secondary px-6">
                    ← Back
                </button>
                <button type="submit" className="btn px-6">
                    Next Step →
                </button>
            </div>
        </form>
    )
}
