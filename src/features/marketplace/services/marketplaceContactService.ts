import { apiClient } from '@/core/api/client'
import type {
  CreateMarketplaceContactEventRequest,
  MarketplaceContactEvent,
  MarketplaceRecentContact,
} from '@/core/api/types'

export const marketplaceContactService = {
  async trackContact(data: CreateMarketplaceContactEventRequest): Promise<MarketplaceContactEvent> {
    return apiClient.post<MarketplaceContactEvent>('/marketplace/contacts', data)
  },

  async getRecentContacts(limit: number = 12): Promise<MarketplaceRecentContact[]> {
    const query = new URLSearchParams({ limit: String(limit) }).toString()
    return apiClient.get<MarketplaceRecentContact[]>(`/marketplace/contacts/recent?${query}`)
  },
}
