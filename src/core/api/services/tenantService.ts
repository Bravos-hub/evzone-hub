/**
 * Tenant Service
 * Handles tenant-related API calls
 */

import { apiClient } from '../client'
import type { Tenant, TenantApplication, LeaseContract } from '../types'

export const tenantService = {
  /**
   * Get all tenant applications
   */
  async getApplications(filters?: { status?: string; siteId?: string }): Promise<TenantApplication[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.siteId) params.append('siteId', filters.siteId)

    const queryString = params.toString()
    return apiClient.get<TenantApplication[]>(`/applications${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get all active leases (tenants)
   */
  async getLeases(filters?: { status?: string; siteId?: string }): Promise<Tenant[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.siteId) params.append('siteId', filters.siteId)

    const queryString = params.toString()
    return apiClient.get<Tenant[]>(`/tenants${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get tenant by ID
   */
  async getById(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`)
  },

  /**
   * Update application status
   */
  async updateApplicationStatus(id: string, status: string, message?: string): Promise<TenantApplication> {
    return apiClient.patch<TenantApplication>(`/applications/${id}/status`, { status, message })
  },

  /**
   * Get tenant contract
   */
  async getContract(tenantId: string): Promise<LeaseContract> {
    return apiClient.get<LeaseContract>(`/tenants/${tenantId}/contract`)
  },
}
