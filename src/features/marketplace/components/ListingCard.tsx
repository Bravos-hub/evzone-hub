import type { ProviderListing, UnifiedMarketplaceListing } from '../types'
import {
    humanizeRegion,
    humanizeStatus,
    listingKindLabel,
    providerStatusBadgeClass,
    relationshipComplianceBadgeClass,
    relationshipStatusBadgeClass
} from '../utils'

type Props = {
    listing: UnifiedMarketplaceListing
    onDetails: (listing: UnifiedMarketplaceListing) => void
    onApply?: (listing: UnifiedMarketplaceListing) => void
    onRequestPartnership?: (listing: ProviderListing) => void
    onSubmitDocs?: (listing: ProviderListing) => void
    canRequestPartnership?: boolean
    ownerOrgId?: string
    isRequestingPartnership?: boolean
    canApplyToSite?: boolean
}

const isProviderListing = (listing: UnifiedMarketplaceListing): listing is ProviderListing => listing.kind === 'Providers'
const isSiteListing = (listing: UnifiedMarketplaceListing): boolean => listing.kind === 'Sites'

export function ListingCard({
    listing,
    onDetails,
    onApply,
    onRequestPartnership,
    onSubmitDocs,
    canRequestPartnership,
    ownerOrgId,
    isRequestingPartnership,
    canApplyToSite
}: Props) {

    // Provider Card
    if (isProviderListing(listing)) {
        return (
            <div className="card space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <div className="text-xs text-muted font-semibold uppercase tracking-wider">Swap Provider</div>
                        <div className="text-lg font-bold text-text truncate">{listing.name}</div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-panel-2 text-text-secondary border border-border-light">
                        Swap Providers
                    </span>
                </div>

                <div className="text-sm text-muted flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {listing.city} - {humanizeRegion(listing.region)}
                </div>

                <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${providerStatusBadgeClass(listing.providerStatus)}`}>
                        Provider: {humanizeStatus(listing.providerStatus)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${relationshipStatusBadgeClass(listing.relationshipStatus)}`}>
                        Relationship: {humanizeStatus(listing.relationshipStatus)}
                    </span>
                    {listing.relationshipId && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${relationshipComplianceBadgeClass(listing.relationshipComplianceState)}`}>
                            Compliance: {listing.relationshipComplianceState || 'PENDING'}
                            {listing.relationshipBlockers > 0 ? ` (${listing.relationshipBlockers})` : ''}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-panel-2 p-2 rounded-lg border border-border-light">
                        <div className="text-muted">Standard</div>
                        <div className="font-semibold text-text">{listing.standard}</div>
                    </div>
                    <div className="bg-panel-2 p-2 rounded-lg border border-border-light">
                        <div className="text-muted">Stations</div>
                        <div className="font-semibold text-text">{listing.stationCount.toLocaleString()}</div>
                    </div>
                    <div className="bg-panel-2 p-2 rounded-lg border border-border-light col-span-2">
                        <div className="text-muted">Batteries</div>
                        <div className="font-semibold text-text">
                            {listing.batteriesSupported.length > 0
                                ? listing.batteriesSupported.slice(0, 4).join(', ')
                                : 'Not specified'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-light">
                    <button
                        className="btn secondary flex-1"
                        onClick={() => onDetails(listing)}
                    >
                        Details
                    </button>
                    {canRequestPartnership && ownerOrgId && listing.canRequest && onRequestPartnership && (
                        <button
                            className="btn flex-1"
                            disabled={isRequestingPartnership}
                            onClick={() => onRequestPartnership(listing)}
                        >
                            {isRequestingPartnership ? 'Requesting...' : 'Request Partnership'}
                        </button>
                    )}
                    {canRequestPartnership &&
                        ownerOrgId &&
                        listing.relationshipId &&
                        listing.relationshipStatus !== 'TERMINATED' && onSubmitDocs && (
                            <button
                                className="btn secondary flex-1"
                                onClick={() => onSubmitDocs(listing)}
                            >
                                Submit Docs
                            </button>
                        )}
                    {canRequestPartnership && !ownerOrgId && (
                        <button className="btn secondary flex-1 opacity-50 cursor-not-allowed" disabled>
                            Request Partnership
                        </button>
                    )}
                </div>
            </div>
        )
    }

    // General Card (Sites, Operators, Technicians)
    return (
        <div className="card space-y-3">
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    <div className="text-xs text-muted font-semibold uppercase tracking-wider">{listing.kind}</div>
                    <div className="text-lg font-bold text-text truncate pr-2">{listing.name}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${listing.kind === 'Sites' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-panel-2 text-text-secondary border border-border-light'
                    }`}>
                    {listingKindLabel(listing.kind)}
                </span>
            </div>

            <div className="text-sm text-muted flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{listing.city} - {humanizeRegion(listing.region)}</span>
            </div>

            {isSiteListing(listing) && 'powerCapacityKw' in listing && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-panel-2 p-2 rounded-lg border border-border-light">
                        <div className="text-muted">Lease Type</div>
                        <div className="font-semibold capitalize text-text">
                            {listing.leaseType ? listing.leaseType.replace('_', ' ').toLowerCase() : 'N/A'}
                        </div>
                    </div>
                    <div className="bg-panel-2 p-2 rounded-lg border border-border-light">
                        <div className="text-muted">Price</div>
                        <div className="font-semibold text-text">
                            {listing.expectedMonthlyPrice ? `$${listing.expectedMonthlyPrice}/mo` : 'Negotiable'}
                        </div>
                    </div>
                    <div className="bg-panel-2 p-2 rounded-lg border border-border-light">
                        <div className="text-muted">Power</div>
                        <div className="font-semibold text-text">{listing.powerCapacityKw} kW</div>
                    </div>
                    <div className="bg-panel-2 p-2 rounded-lg border border-border-light">
                        <div className="text-muted">Footfall</div>
                        <div className="font-semibold text-text">
                            {listing.expectedFootfall ? listing.expectedFootfall.toLowerCase() : 'medium'}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-light">
                <button
                    className="btn secondary flex-1"
                    onClick={() => onDetails(listing)}
                >
                    Details
                </button>
                {listing.kind === 'Sites' && canApplyToSite && onApply && (
                    <button
                        className="btn flex-1"
                        onClick={() => onApply(listing)}
                    >
                        Apply
                    </button>
                )}
            </div>
        </div>
    )
}
