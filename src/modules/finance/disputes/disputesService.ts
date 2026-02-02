/**
 * Disputes Service
 */

import { apiClient } from '@/core/api/client'

export interface DisputeRecord {
  id: string
  customer?: string
  type?: string
  amount?: number
  status?: string
  openedAt?: string
  sessionId?: string
}

export const disputesService = {
  async getAll(filters?: { status?: string }): Promise<DisputeRecord[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    const queryString = params.toString()
    return apiClient.get<DisputeRecord[]>(`/disputes${queryString ? `?${queryString}` : ''}`)
  },
}
