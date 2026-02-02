/**
 * Discount Service
 * Handles discount-related API calls
 */

import { apiClient } from '@/core/api/client'

export type DiscountStatus = 'Active' | 'Scheduled' | 'Expired' | 'Draft'
export type DiscountType = 'Promo code' | 'Automatic' | 'Partnership'

export interface DiscountRecord {
  id: string
  name?: string
  code?: string
  type?: string
  kind?: string
  value?: number | string
  valueType?: 'PERCENT' | 'FLAT' | 'KWH'
  currency?: string
  validFrom?: string
  validTo?: string
  startDate?: string
  endDate?: string
  sites?: string[]
  stationIds?: string[]
  applicableStations?: string[]
  redemptions?: number
  used?: number
  status?: string
}

export const discountService = {
  async getAll(filters?: { status?: string; type?: string; siteId?: string }): Promise<DiscountRecord[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.siteId) params.append('siteId', filters.siteId)

    const queryString = params.toString()
    return apiClient.get<DiscountRecord[]>(`/discounts${queryString ? `?${queryString}` : ''}`)
  },
}
