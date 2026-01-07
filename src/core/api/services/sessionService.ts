/**
 * Session Service
 * Handles charging session-related API calls
 */

import { apiClient } from '../client'
import type { ChargingSession } from '../types'

export const sessionService = {
  /**
   * Get all active sessions
   */
  async getActive(): Promise<ChargingSession[]> {
    return apiClient.get<ChargingSession[]>('/sessions/active')
  },

  /**
   * Get session by ID
   */
  async getById(id: string): Promise<ChargingSession> {
    return apiClient.get<ChargingSession>(`/sessions/${id}`)
  },

  /**
   * Get session statistics
   */
  async getStats(): Promise<unknown> {
    return apiClient.get<unknown>('/sessions/stats/summary')
  },

  /**
   * Get sessions for a station
   */
  async getByStation(stationId: string, activeOnly?: boolean): Promise<{ active: ChargingSession[]; recent?: ChargingSession[] } | ChargingSession[]> {
    const query = activeOnly ? '?active=true' : ''
    return apiClient.get<{ active: ChargingSession[]; recent?: ChargingSession[] } | ChargingSession[]>(`/sessions/station/${stationId}${query}`)
  },

  /**
   * Get sessions for a user
   */
  async getByUser(userId: string, activeOnly?: boolean): Promise<{ active: ChargingSession[]; recent?: ChargingSession[] } | ChargingSession[]> {
    const query = activeOnly ? '?active=true' : ''
    return apiClient.get<{ active: ChargingSession[]; recent?: ChargingSession[] } | ChargingSession[]>(`/sessions/user/${userId}${query}`)
  },

  /**
   * Get session history with pagination
   */
  async getHistory(query?: { page?: number; limit?: number; status?: string }): Promise<{
    sessions: ChargingSession[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const params = new URLSearchParams()
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.status) params.append('status', query.status)
    
    const queryString = params.toString()
    return apiClient.get(`/sessions/history/all${queryString ? `?${queryString}` : ''}`)
  },
}

