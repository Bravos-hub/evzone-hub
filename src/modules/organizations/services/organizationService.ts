/**
 * Organization Service
 * Handles organization-related API calls
 */

import { apiClient } from '../client'
import type { Organization, CreateOrganizationRequest } from '../types'

export const organizationService = {
  /**
   * Get all organizations
   */
  async getAll(): Promise<Organization[]> {
    return apiClient.get<Organization[]>('/organizations')
  },

  /**
   * Get organization by ID
   */
  async getById(id: string): Promise<Organization> {
    return apiClient.get<Organization>(`/organizations/${id}`)
  },

  /**
   * Create organization
   */
  async create(data: CreateOrganizationRequest): Promise<Organization> {
    return apiClient.post<Organization>('/organizations', data)
  },
}

