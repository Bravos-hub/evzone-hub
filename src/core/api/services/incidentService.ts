/**
 * Incident Service
 * Handles incident-related API calls
 */

import { apiClient } from '../client'
import type { Incident } from '@/core/types/domain'

export interface CreateIncidentRequest {
  stationId: string
  assetId?: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  title: string
  description: string
}

export interface UpdateIncidentRequest {
  severity?: 'Critical' | 'High' | 'Medium' | 'Low'
  title?: string
  description?: string
  status?: 'Open' | 'Acknowledged' | 'In-Progress' | 'Resolved' | 'Closed'
  assignedTo?: string
}

export interface AssignIncidentRequest {
  assignedTo: string
}

export interface ResolveIncidentRequest {
  resolution?: string
}

export const incidentService = {
  /**
   * Get all incidents
   */
  async getAll(query?: { 
    status?: string
    severity?: string
    stationId?: string
  }): Promise<Incident[]> {
    const params = new URLSearchParams()
    if (query?.status) params.append('status', query.status)
    if (query?.severity) params.append('severity', query.severity)
    if (query?.stationId) params.append('stationId', query.stationId)
    
    const queryString = params.toString()
    return apiClient.get<Incident[]>(`/incidents${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get incident by ID
   */
  async getById(id: string): Promise<Incident> {
    return apiClient.get<Incident>(`/incidents/${id}`)
  },

  /**
   * Create incident
   */
  async create(data: CreateIncidentRequest): Promise<Incident> {
    return apiClient.post<Incident>('/incidents', data)
  },

  /**
   * Update incident
   */
  async update(id: string, data: UpdateIncidentRequest): Promise<Incident> {
    return apiClient.patch<Incident>(`/incidents/${id}`, data)
  },

  /**
   * Assign incident
   */
  async assign(id: string, data: AssignIncidentRequest): Promise<Incident> {
    return apiClient.post<Incident>(`/incidents/${id}/assign`, data)
  },

  /**
   * Resolve incident
   */
  async resolve(id: string, data?: ResolveIncidentRequest): Promise<Incident> {
    return apiClient.post<Incident>(`/incidents/${id}/resolve`, data || {})
  },

  /**
   * Delete incident
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/incidents/${id}`)
  },
}
