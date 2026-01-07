/**
 * Tenant Service
 * Handles tenant-related API calls
 */

import { apiClient } from '../client'
import type { Tenant, TenantApplication, LeaseContract } from '../types'

export const tenantService = {
  /**
   * Get all tenants/applications
   */
  async getAll(filters?: { status?: string; siteId?: string }): Promise<(Tenant | TenantApplication)[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.siteId) params.append('siteId', filters.siteId)
    
    const queryString = params.toString()
    return apiClient.get<(Tenant | TenantApplication)[]>(`/tenants${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get tenant by ID
   */
  async getById(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`)
  },

  /**
   * Get tenant contract
   */
  async getContract(tenantId: string): Promise<LeaseContract> {
    return apiClient.get<LeaseContract>(`/tenants/${tenantId}/contract`)
  },
}
