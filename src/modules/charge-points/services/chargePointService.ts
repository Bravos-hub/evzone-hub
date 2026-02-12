/**
 * Charge Point Service
 * Handles charge point-related API calls
 */

import { apiClient } from '@/core/api/client'
import type { ChargePoint } from '@/core/types/domain'
import type { CreateChargePointRequest, UpdateChargePointRequest } from '@/core/api/types'

export const chargePointService = {
  /**
   * Get all charge points
   */
  async getAll(query?: { stationId?: string; status?: string }): Promise<ChargePoint[]> {
    const params = new URLSearchParams()
    if (query?.stationId) params.append('stationId', query.stationId)
    if (query?.status) params.append('status', query.status)

    const queryString = params.toString()
    return apiClient.get<ChargePoint[]>(`/charge-points${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get charge point by ID
   */
  async getById(id: string): Promise<ChargePoint> {
    return apiClient.get<ChargePoint>(`/charge-points/${id}`)
  },

  /**
   * Get charge point by OCPP ID
   */
  async getByOcppId(ocppId: string): Promise<ChargePoint | null> {
    return apiClient.get<ChargePoint | null>(`/charge-points/by-ocpp/${encodeURIComponent(ocppId)}`)
  },

  /**
   * Get charge points by station ID
   */
  async getByStationId(stationId: string): Promise<ChargePoint[]> {
    return apiClient.get<ChargePoint[]>(`/charge-points?stationId=${stationId}`)
  },

  /**
   * Create charge point
   */
  async create(data: CreateChargePointRequest): Promise<ChargePoint> {
    return apiClient.post<ChargePoint>('/charge-points', data)
  },

  /**
   * Update charge point
   */
  async update(id: string, data: UpdateChargePointRequest): Promise<ChargePoint> {
    return apiClient.patch<ChargePoint>(`/charge-points/${id}`, data)
  },

  /**
   * Delete charge point
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/charge-points/${id}`)
  },

  /**
   * Reboot charge point
   */
  async reboot(id: string): Promise<void> {
    return apiClient.post<void>(`/charge-points/${id}/reboot`)
  },
}
