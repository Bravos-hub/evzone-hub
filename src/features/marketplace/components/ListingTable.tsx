import type { ProviderListing, UnifiedMarketplaceListing } from '../types'
import {
    humanizeRegion,
    humanizeStatus,
    listingKindLabel,
    providerStatusBadgeClass,
    relationshipStatusBadgeClass
} from '../utils'

type Props = {
    listings: UnifiedMarketplaceListing[]
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

export function ListingTable({
    listings,
    onDetails,
    onApply,
    onRequestPartnership,
    onSubmitDocs,
    canRequestPartnership,
    ownerOrgId,
    isRequestingPartnership,
    canApplyToSite
}: Props) {

    if (listings.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
                No listings found matching your filters.
            </div>
        )
    }

    return (
        <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col">Entity</th>
                        <th scope="col">Location</th>
                        <th scope="col">Details</th>
                        <th scope="col" className="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {listings.map((listing) => {
                        const isProvider = isProviderListing(listing)
                        const isSite = isSiteListing(listing)

                        return (
                            <tr key={`${listing.kind}:${listing.id}`}>
                                <td>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-text">{listing.name}</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit mt-1 ${listing.kind === 'Sites' ? 'bg-amber-500/10 text-amber-600' : 'bg-panel-2 text-text-secondary border border-border-light'
                                            }`}>
                                            {listingKindLabel(listing.kind)}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col">
                                        <span className="text-text">{listing.city}</span>
                                        <span className="text-xs text-muted">{humanizeRegion(listing.region)}</span>
                                    </div>
                                </td>
                                <td>
                                    {isProvider ? (
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs w-fit ${providerStatusBadgeClass(listing.providerStatus)}`}>
                                                {humanizeStatus(listing.providerStatus)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs w-fit ${relationshipStatusBadgeClass(listing.relationshipStatus)}`}>
                                                {humanizeStatus(listing.relationshipStatus)}
                                            </span>
                                        </div>
                                    ) : isSite && 'powerCapacityKw' in listing ? (
                                        <div className="flex flex-col text-xs text-muted">
                                            <span>{listing.powerCapacityKw} kW</span>
                                            <span>{listing.expectedMonthlyPrice ? `$${listing.expectedMonthlyPrice}/mo` : 'Negotiable'}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs italic text-muted">No details</span>
                                    )}
                                </td>
                                <td className="text-right font-medium">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => onDetails(listing)}
                                            className="text-accent hover:text-accent-hover text-xs font-semibold uppercase tracking-wide"
                                        >
                                            Details
                                        </button>
                                        {isSite && canApplyToSite && onApply && (
                                            <button
                                                onClick={() => onApply(listing)}
                                                className="text-text-secondary hover:text-text text-xs font-semibold uppercase tracking-wide"
                                            >
                                                Apply
                                            </button>
                                        )}
                                        {isProvider && canRequestPartnership && ownerOrgId && listing.canRequest && onRequestPartnership && (
                                            <button
                                                onClick={() => onRequestPartnership(listing)}
                                                disabled={isRequestingPartnership}
                                                className="text-text-secondary hover:text-text disabled:opacity-50 text-xs font-semibold uppercase tracking-wide"
                                            >
                                                Request
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
