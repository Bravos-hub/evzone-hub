/**
 * Analytics Service
 * Handles analytics-related API calls
 */

import { apiClient } from '@/core/api/client'
import type {
  DashboardMetrics,
  SystemHealthResponse,
  SystemEvent,
  ServiceLog,
  RestartServiceResponse
} from '@/core/api/types'

export const analyticsService = {
  /**
   * Get dashboard metrics
   */
  async getDashboard(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>('/analytics/dashboard')
  },

  /**
   * Get uptime statistics
   */
  async getUptime(period: '24h' | '7d' | '30d' = '7d'): Promise<unknown> {
    return apiClient.get<unknown>(`/analytics/uptime?period=${period}`)
  },

  /**
   * Get usage analytics
   */
  async getUsage(period: '24h' | '7d' | '30d' = '7d'): Promise<unknown> {
    return apiClient.get<unknown>(`/analytics/usage?period=${period}`)
  },

  /**
   * Get revenue analytics
   */
  async getRevenue(period: '24h' | '7d' | '30d' = '7d'): Promise<unknown> {
    return apiClient.get<unknown>(`/analytics/revenue?period=${period}`)
  },

  /**
   * Get energy analytics
   */
  async getEnergy(period: '24h' | '7d' | '30d' = '7d'): Promise<unknown> {
    return apiClient.get<unknown>(`/analytics/energy?period=${period}`)
  },

  /**
   * Get real-time statistics
   */
  async getRealtime(): Promise<unknown> {
    return apiClient.get<unknown>('/analytics/realtime')
  },

  /**
   * Get operator dashboard metrics
   */
  async getOperatorDashboard(startDate?: string, endDate?: string): Promise<unknown> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const queryString = params.toString()
    return apiClient.get<unknown>(`/analytics/operator/dashboard${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get reseller dashboard metrics
   */
  async getResellerDashboard(startDate?: string, endDate?: string): Promise<unknown> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const queryString = params.toString()
    return apiClient.get<unknown>(`/analytics/reseller/dashboard${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Export data
   */
  async exportData(type: string, format: string, startDate: string, endDate: string, orgId?: string): Promise<Blob> {
    const params = new URLSearchParams()
    params.append('type', type)
    params.append('format', format)
    params.append('start', startDate)
    params.append('end', endDate)
    if (orgId) params.append('orgId', orgId)

    const { API_CONFIG } = await import('@/core/api/config')
    const response = await fetch(`${API_CONFIG.baseURL}/analytics/export?${params.toString()}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return response.blob()
  },

  /**
   * Get regional metrics
   */
  async getRegionalMetrics(): Promise<unknown> {
    return apiClient.get<unknown>('/analytics/regions')
  },

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<SystemHealthResponse> {
    return apiClient.get<SystemHealthResponse>('/analytics/system-health')
  },

  /**
   * Get system events
   */
  async getSystemEvents(limit?: number): Promise<SystemEvent[]> {
    const params = limit ? `?limit=${limit}` : ''
    return apiClient.get<SystemEvent[]>(`/analytics/system-health/events${params}`)
  },

  /**
   * Restart a service (admin only)
   */
  async restartService(serviceName: string): Promise<RestartServiceResponse> {
    return apiClient.post<RestartServiceResponse>(`/analytics/services/${serviceName}/restart`)
  },

  /**
   * Get service logs
   */
  async getServiceLogs(serviceName: string, lines?: number): Promise<ServiceLog[]> {
    const params = lines ? `?lines=${lines}` : ''
    return apiClient.get<ServiceLog[]>(`/analytics/services/${serviceName}/logs${params}`)
  },
}
