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

  /**
   * Submit new application
   */
  async submitApplication(data: any): Promise<TenantApplication> {
    return apiClient.post<TenantApplication>('/applications', data)
  },

  /**
   * Upload document to application
   */
  async uploadDocument(applicationId: string, file: File, category: string, documentType: string, required: boolean): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    formData.append('documentType', documentType)
    formData.append('required', String(required))

    return apiClient.post(`/applications/${applicationId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * Update commercial terms (site owner only)
   */
  async updateApplicationTerms(id: string, terms: any): Promise<TenantApplication> {
    return apiClient.patch<TenantApplication>(`/applications/${id}/terms`, terms)
  },
}
