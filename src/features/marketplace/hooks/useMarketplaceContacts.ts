import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/data/queryKeys'
import { marketplaceContactService } from '../services/marketplaceContactService'
import type { CreateMarketplaceContactEventRequest } from '@/core/api/types'

type QueryOptions = {
  enabled?: boolean
}

export function useMarketplaceRecentContacts(limit: number = 12, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.marketplace.recentContacts(limit),
    queryFn: () => marketplaceContactService.getRecentContacts(limit),
    enabled: options?.enabled ?? true,
  })
}

export function useTrackMarketplaceContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMarketplaceContactEventRequest) => marketplaceContactService.trackContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'recent-contacts'] })
    },
  })
}
