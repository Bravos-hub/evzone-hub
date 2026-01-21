/**
 * Dispatch Service
 * Handles dispatch-related API calls
 */

import { apiClient } from '@/core/api/client'
import type { Dispatch } from '@/core/api/types'

export interface CreateDispatchRequest {
  title: string
  description: string
  priority: 'Critical' | 'High' | 'Normal' | 'Low'
  stationId: string
  dueDate: string
  dueTime: string
  estimatedDuration: string
  incidentId?: string
  requiredSkills: string[]
}

export interface UpdateDispatchRequest {
  title?: string
  description?: string
  priority?: 'Critical' | 'High' | 'Normal' | 'Low'
  status?: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'
  assignee?: string
  notes?: string
}

export interface AssignDispatchRequest {
  assignee: string
  assigneeContact: string
}

export const dispatchService = {
  /**
   * Get all dispatches
   */
  async getAll(query?: {
    status?: string
    priority?: string
    stationId?: string
  }): Promise<Dispatch[]> {
    const params = new URLSearchParams()
    if (query?.status) params.append('status', query.status)
    if (query?.priority) params.append('priority', query.priority)
    if (query?.stationId) params.append('stationId', query.stationId)

    const queryString = params.toString()
    return apiClient.get<Dispatch[]>(`/dispatches${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get dispatch by ID
   */
  async getById(id: string): Promise<Dispatch> {
    return apiClient.get<Dispatch>(`/dispatches/${id}`)
  },

  /**
   * Create dispatch
   */
  async create(data: CreateDispatchRequest): Promise<Dispatch> {
    return apiClient.post<Dispatch>('/dispatches', data)
  },

  /**
   * Update dispatch
   */
  async update(id: string, data: UpdateDispatchRequest): Promise<Dispatch> {
    return apiClient.patch<Dispatch>(`/dispatches/${id}`, data)
  },

  /**
   * Assign dispatch
   */
  async assign(id: string, data: AssignDispatchRequest): Promise<Dispatch> {
    return apiClient.post<Dispatch>(`/dispatches/${id}/assign`, data)
  },

  /**
   * Delete dispatch
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/dispatches/${id}`)
  },
}
