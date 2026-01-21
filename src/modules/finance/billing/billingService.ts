/**
 * Billing Service
 * Handles billing-related API calls
 */

import { apiClient } from '@/core/api/client'

export interface Invoice {
  id: string
  type: 'Subscription' | 'Usage' | 'Settlement' | 'Credit'
  org: string
  amount: number
  currency: string
  status: 'Paid' | 'Pending' | 'Overdue' | 'Refunded'
  issuedAt: string
  dueAt: string
  paidAt?: string
  description: string
  lineItems?: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
}

export interface GenerateInvoiceRequest {
  organizationId: string
  type: 'Subscription' | 'Usage' | 'Settlement' | 'Credit'
  period?: { start: string; end: string }
  description?: string
}

export const billingService = {
  /**
   * Get all invoices
   */
  async getInvoices(query?: {
    type?: string
    status?: string
    orgId?: string
  }): Promise<Invoice[]> {
    const params = new URLSearchParams()
    if (query?.type) params.append('type', query.type)
    if (query?.status) params.append('status', query.status)
    if (query?.orgId) params.append('orgId', query.orgId)

    const queryString = params.toString()
    return apiClient.get<Invoice[]>(`/billing/invoices${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice> {
    return apiClient.get<Invoice>(`/billing/invoices/${id}`)
  },

  /**
   * Generate invoice
   */
  async generateInvoice(data: GenerateInvoiceRequest): Promise<Invoice> {
    return apiClient.post<Invoice>('/billing/invoices/generate', data)
  },
}
