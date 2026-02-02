/**
 * Webhook Service
 * Handles webhook-related API calls
 */

import { apiClient } from '@/core/api/client'
import type { Webhook } from '@/core/types/domain'

export interface CreateWebhookRequest {
  name: string
  url: string
  events: Array<
    | 'session.started'
    | 'session.completed'
    | 'session.failed'
    | 'booking.created'
    | 'booking.cancelled'
    | 'station.status'
    | 'incident.created'
    | 'payment.completed'
    | 'chargepoint.faulted'
  >
  secret?: string
}

export interface UpdateWebhookRequest {
  name?: string
  url?: string
  events?: Array<
    | 'session.started'
    | 'session.completed'
    | 'session.failed'
    | 'booking.created'
    | 'booking.cancelled'
    | 'station.status'
    | 'incident.created'
    | 'payment.completed'
    | 'chargepoint.faulted'
  >
  status?: 'Active' | 'Disabled' | 'Failed'
  secret?: string
}

export interface WebhookDelivery {
  id: string
  endpoint: string
  event: string
  status: 'Delivered' | 'Failed' | 'Retrying'
  statusCode?: number
  createdAt: string
}

export const webhookService = {
  /**
   * Get all webhooks
   */
  async getAll(): Promise<Webhook[]> {
    return apiClient.get<Webhook[]>('/webhooks')
  },

  /**
   * Get webhook by ID
   */
  async getById(id: string): Promise<Webhook> {
    return apiClient.get<Webhook>(`/webhooks/${id}`)
  },

  /**
   * Create webhook
   */
  async create(data: CreateWebhookRequest): Promise<Webhook> {
    return apiClient.post<Webhook>('/webhooks', data)
  },

  /**
   * Update webhook
   */
  async update(id: string, data: UpdateWebhookRequest): Promise<Webhook> {
    return apiClient.patch<Webhook>(`/webhooks/${id}`, data)
  },

  /**
   * Delete webhook
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/webhooks/${id}`)
  },

  /**
   * Test webhook
   */
  async test(id: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    return apiClient.post<{ success: boolean; statusCode?: number; error?: string }>(`/webhooks/${id}/test`, {})
  },

  /**
   * Get webhook delivery logs
   */
  async getDeliveries(filters?: { status?: string; event?: string; limit?: number }): Promise<WebhookDelivery[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.event) params.append('event', filters.event)
    if (filters?.limit) params.append('limit', String(filters.limit))
    const queryString = params.toString()
    return apiClient.get<WebhookDelivery[]>(`/webhooks/deliveries${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Replay a webhook delivery
   */
  async replayDelivery(deliveryId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/webhooks/deliveries/${deliveryId}/replay`, {})
  },
}
