/**
 * Settlement Service
 */

import { apiClient } from '@/core/api/client'

export interface SettlementRecord {
  id: string
  region?: string
  org?: string
  type?: string
  amount?: number
  currency?: string
  status?: string
  startedAt?: string
  finishedAt?: string
  note?: string
}

export const settlementService = {
  async getAll(filters?: { status?: string; region?: string }): Promise<SettlementRecord[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.region) params.append('region', filters.region)
    const queryString = params.toString()
    return apiClient.get<SettlementRecord[]>(`/settlements${queryString ? `?${queryString}` : ''}`)
  },
}
