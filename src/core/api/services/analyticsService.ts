/**
 * Analytics Service
 * Handles analytics-related API calls
 */

import { apiClient } from '../client'
import type { DashboardMetrics } from '../types'

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
    
    const { API_CONFIG, TOKEN_STORAGE_KEYS } = await import('../config')
    const token = localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken)
    
    const response = await fetch(`${API_CONFIG.baseURL}/analytics/export?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Export failed')
    }
    
    return response.blob()
  },
}

