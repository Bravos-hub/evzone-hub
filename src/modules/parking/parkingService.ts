/**
 * Parking Service
 * Handles parking bay API calls
 */

import { apiClient } from '@/core/api/client'
import type { ParkingBay } from '@/core/api/types'

export interface CreateParkingBayRequest {
  siteId: string
  bay: string
  type: ParkingBay['type']
  status?: ParkingBay['status']
  chargerId?: string
  rate: number
}

export const parkingService = {
  async getBays(filters?: { siteId?: string; status?: string }): Promise<ParkingBay[]> {
    const params = new URLSearchParams()
    if (filters?.siteId) params.append('siteId', filters.siteId)
    if (filters?.status) params.append('status', filters.status)
    const queryString = params.toString()
    return apiClient.get<ParkingBay[]>(`/parking/bays${queryString ? `?${queryString}` : ''}`)
  },

  async createBay(data: CreateParkingBayRequest): Promise<ParkingBay> {
    return apiClient.post<ParkingBay>('/parking/bays', data)
  },

  async deleteBay(id: string): Promise<void> {
    return apiClient.delete<void>(`/parking/bays/${id}`)
  },
}
