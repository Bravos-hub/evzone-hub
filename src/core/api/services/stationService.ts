/**
 * Station Service
 * Handles station-related API calls
 */

import { apiClient } from '../client'
import type { Station, CreateStationRequest, UpdateStationRequest, SwapBay, SwapBayInput, Battery, BatteryInput } from '../types'

export const stationService = {
  /**
   * Get all stations
   */
  async getAll(query?: { status?: string; orgId?: string; limit?: number; offset?: number }): Promise<Station[]> {
    const params = new URLSearchParams()
    if (query?.status) params.append('status', query.status)
    if (query?.orgId) params.append('orgId', query.orgId)
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.offset) params.append('offset', query.offset.toString())
    
    const queryString = params.toString()
    return apiClient.get<Station[]>(`/stations${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get station by ID
   */
  async getById(id: string): Promise<Station> {
    return apiClient.get<Station>(`/stations/${id}`)
  },

  /**
   * Get station by code
   */
  async getByCode(code: string): Promise<Station> {
    return apiClient.get<Station>(`/stations/code/${code}`)
  },

  /**
   * Find nearby stations
   */
  async getNearby(lat: number, lng: number, radius?: number, limit?: number): Promise<Station[]> {
    const params = new URLSearchParams()
    params.append('lat', lat.toString())
    params.append('lng', lng.toString())
    if (radius) params.append('radius', radius.toString())
    if (limit) params.append('limit', limit.toString())
    
    return apiClient.get<Station[]>(`/stations/nearby?${params.toString()}`)
  },

  /**
   * Get station statistics
   */
  async getStats(id: string): Promise<unknown> {
    return apiClient.get<unknown>(`/stations/${id}/stats`)
  },

  /**
   * Create station
   */
  async create(data: CreateStationRequest): Promise<Station> {
    return apiClient.post<Station>('/stations', data)
  },

  /**
   * Update station
   */
  async update(id: string, data: UpdateStationRequest): Promise<Station> {
    return apiClient.patch<Station>(`/stations/${id}`, data)
  },

  /**
   * Delete station
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/stations/${id}`)
  },

  /**
   * Update station health score
   */
  async updateHealth(id: string): Promise<unknown> {
    return apiClient.post<unknown>(`/stations/${id}/health`)
  },

  /**
   * Get swap bays for a station
   */
  async getSwapBays(id: string): Promise<SwapBay[]> {
    return apiClient.get<SwapBay[]>(`/stations/${id}/swap-bays`)
  },

  /**
   * Upsert swap bays for a station
   */
  async upsertSwapBays(id: string, bays: SwapBayInput[]): Promise<SwapBay[]> {
    return apiClient.put<SwapBay[]>(`/stations/${id}/swap-bays`, { bays })
  },

  /**
   * Get batteries for a station
   */
  async getBatteries(id: string): Promise<Battery[]> {
    return apiClient.get<Battery[]>(`/stations/${id}/batteries`)
  },

  /**
   * Upsert batteries for a station
   */
  async upsertBatteries(id: string, batteries: BatteryInput[]): Promise<Battery[]> {
    return apiClient.put<Battery[]>(`/stations/${id}/batteries`, { batteries })
  },
}

