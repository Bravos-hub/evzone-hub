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
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-gray-500 dark:text-gray-400">
                No listings found matching your filters.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Entity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Location
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {listings.map((listing) => {
                        const isProvider = isProviderListing(listing)
                        const isSite = isSiteListing(listing)

                        return (
                            <tr key={`${listing.kind}:${listing.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{listing.name}</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit mt-1 ${listing.kind === 'Sites' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {listingKindLabel(listing.kind)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col">
                                        <span>{listing.city}</span>
                                        <span className="text-xs">{humanizeRegion(listing.region)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                                        <div className="flex flex-col text-xs">
                                            <span>{listing.powerCapacityKw} kW</span>
                                            <span>{listing.expectedMonthlyPrice ? `$${listing.expectedMonthlyPrice}/mo` : 'Negotiable'}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs italic text-gray-400">No details</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onDetails(listing)}
                                            className="text-accent hover:text-accent/80"
                                        >
                                            Details
                                        </button>
                                        {isSite && canApplyToSite && onApply && (
                                            <button
                                                onClick={() => onApply(listing)}
                                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                Apply
                                            </button>
                                        )}
                                        {isProvider && canRequestPartnership && ownerOrgId && listing.canRequest && onRequestPartnership && (
                                            <button
                                                onClick={() => onRequestPartnership(listing)}
                                                disabled={isRequestingPartnership}
                                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
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
