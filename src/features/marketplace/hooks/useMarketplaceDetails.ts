import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/data/queryKeys'
import { marketplaceDetailsService } from '../services/marketplaceDetailsService'
import type { MarketplaceSummaryListing } from '../types'

export function useMarketplaceDetails(listing: MarketplaceSummaryListing | null, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.marketplace.detail(listing?.kind, listing?.id),
    queryFn: () => marketplaceDetailsService.getDetails(listing as MarketplaceSummaryListing),
    enabled: Boolean(listing) && enabled,
  })
}
