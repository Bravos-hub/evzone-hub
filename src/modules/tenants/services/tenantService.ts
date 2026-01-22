/**
 * Tenant Service
 * Handles tenant and lease contract API calls
 */

import { apiClient } from '@/core/api/client'
import type { LeaseContract, Tenant } from '@/core/api/types'

export type TenantFilters = {
  siteId?: string
  status?: string
  type?: string
  q?: string
}

export const tenantService = {
  async getAll(filters?: TenantFilters): Promise<Tenant[]> {
    const params = new URLSearchParams()
    if (filters?.siteId) params.append('siteId', filters.siteId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.q) params.append('q', filters.q)

    const queryString = params.toString()
    return apiClient.get<Tenant[]>(`/tenants${queryString ? `?${queryString}` : ''}`)
  },

  async getById(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`)
  },

  async getContract(tenantId: string): Promise<LeaseContract> {
    return apiClient.get<LeaseContract>(`/tenants/${tenantId}/contract`)
  },
}
