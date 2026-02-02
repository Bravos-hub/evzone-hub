/**
 * Support Service
 * Handles support ticket API calls
 */

import { apiClient } from '@/core/api/client'

export interface SupportTicket {
  id: string
  subject?: string
  customer?: string
  priority?: string
  status?: string
  createdAt?: string
  assignee?: string
}

export const supportService = {
  async getTickets(filters?: { status?: string }): Promise<SupportTicket[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    const queryString = params.toString()
    return apiClient.get<SupportTicket[]>(`/support/tickets${queryString ? `?${queryString}` : ''}`)
  },
}
