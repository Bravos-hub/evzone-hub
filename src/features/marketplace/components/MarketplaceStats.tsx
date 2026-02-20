import type { MarketplaceRecentContact, MarketplaceContactEventType, MarketplaceContactEntityKind } from '@/core/api/types'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import type { MarketplaceSummaryListing, MarketplaceEntityKind } from '../types'
import { humanizeRegion, normalizeRegion } from '../utils'

// Mapping helpers (moved from Marketplace.tsx to be close to usage or repeated)
const RECENT_KIND_TO_LISTING_KIND: Record<MarketplaceContactEntityKind, MarketplaceEntityKind> = {
    SITE: 'Sites',
    OPERATOR: 'Operators',
    TECHNICIAN: 'Technicians',
    PROVIDER: 'Providers',
}

function listingKindLabel(kind: MarketplaceEntityKind): string {
    return kind === 'Providers' ? 'Swap Providers' : kind
}

function humanizeRecentEventType(value: MarketplaceContactEventType): string {
    if (value === 'APPLY_SITE') return 'Applied for site'
    if (value === 'REQUEST_PARTNERSHIP') return 'Requested partnership'
    if (value === 'EMAIL') return 'Emailed'
    if (value === 'CALL') return 'Called'
    return value
}

const mapRecentContactToListing = (item: MarketplaceRecentContact): MarketplaceSummaryListing => ({
    id: item.entityId,
    kind: RECENT_KIND_TO_LISTING_KIND[item.entityKind],
    name: item.entityName || 'Unknown listing',
    city: item.entityCity || 'Unknown',
    region: item.entityRegion || 'UNKNOWN',
})

type Props = {
    recentContacts: MarketplaceRecentContact[]
    isLoading: boolean
    onOpenDetails: (listing: MarketplaceSummaryListing) => void
}

export function MarketplaceStats({ recentContacts, isLoading, onOpenDetails }: Props) {
    return (
        <div className="card space-y-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">My Listings</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Recently contacted entities</div>
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                            <TextSkeleton lines={2} />
                        </div>
                    ))}
                </div>
            ) : recentContacts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No recent outreach yet. Email, call, apply, or request partnership to populate My Listings.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {recentContacts.map((item) => {
                        const listing = mapRecentContactToListing(item)
                        return (
                            <button
                                type="button"
                                key={`${item.entityKind}:${item.entityId}`}
                                className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-left hover:border-accent/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => onOpenDetails(listing)}
                            >
                                <div className="text-xs text-gray-500 dark:text-gray-400">{listingKindLabel(listing.kind)}</div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{listing.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {listing.city} - {humanizeRegion(normalizeRegion(listing.region))}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {humanizeRecentEventType(item.lastEventType)} - {new Date(item.lastContactedAt).toLocaleString()}
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
