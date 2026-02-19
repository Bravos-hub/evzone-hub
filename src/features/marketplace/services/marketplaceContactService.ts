import { apiClient } from '@/core/api/client'
import { ApiException } from '@/core/api/errors'
import type {
  CreateMarketplaceContactEventRequest,
  MarketplaceContactEvent,
  MarketplaceRecentContact,
} from '@/core/api/types'

const isNotFoundError = (error: unknown): boolean =>
  error instanceof ApiException && error.statusCode === 404

const normalizeListPayload = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== 'object') return []

  const record = payload as Record<string, unknown>
  if (Array.isArray(record.data)) return record.data as T[]
  if (Array.isArray(record.items)) return record.items as T[]
  if (Array.isArray(record.results)) return record.results as T[]
  return []
}

export const marketplaceContactService = {
  async trackContact(data: CreateMarketplaceContactEventRequest): Promise<MarketplaceContactEvent> {
    try {
      return await apiClient.post<MarketplaceContactEvent>('/marketplace/contacts', data)
    } catch (error) {
      // Tracking should never block user actions when backend rollout is incomplete.
      if (isNotFoundError(error)) {
        return {
          id: `local-${Date.now()}`,
          actorId: '',
          createdAt: new Date().toISOString(),
          ...data,
        }
      }
      throw error
    }
  },

  async getRecentContacts(limit: number = 12): Promise<MarketplaceRecentContact[]> {
    const query = new URLSearchParams({ limit: String(limit) }).toString()
    try {
      const payload = await apiClient.get<unknown>(`/marketplace/contacts/recent?${query}`)
      return normalizeListPayload<MarketplaceRecentContact>(payload)
    } catch (error) {
      if (isNotFoundError(error)) return []
      throw error
    }
  },
}
