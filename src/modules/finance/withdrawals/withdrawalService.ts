/**
 * Withdrawal Service
 * Handles withdrawal and payment method related API calls
 */

import { apiClient } from '@/core/api/client'
import type {
  WalletBalance,
  PaymentMethod,
  CreatePaymentMethodRequest,
  WithdrawalRequest,
  WithdrawalTransaction,
} from '@/core/api/types'

export const withdrawalService = {
  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<WalletBalance> {
    return apiClient.get<WalletBalance>('/wallet/balance')
  },

  /**
   * Get all payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return apiClient.get<PaymentMethod[]>('/payment-methods')
  },

  /**
   * Add a new payment method
   */
  async addPaymentMethod(data: CreatePaymentMethodRequest): Promise<PaymentMethod> {
    return apiClient.post<PaymentMethod>('/payment-methods', data)
  },

  /**
   * Update a payment method
   */
  async updatePaymentMethod(id: string, data: Partial<CreatePaymentMethodRequest>): Promise<PaymentMethod> {
    return apiClient.patch<PaymentMethod>(`/payment-methods/${id}`, data)
  },

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(id: string): Promise<void> {
    return apiClient.delete<void>(`/payment-methods/${id}`)
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(id: string): Promise<PaymentMethod> {
    return apiClient.post<PaymentMethod>(`/payment-methods/${id}/set-default`)
  },

  /**
   * Request a withdrawal
   */
  async requestWithdrawal(data: WithdrawalRequest): Promise<WithdrawalTransaction> {
    return apiClient.post<WithdrawalTransaction>('/withdrawals', data)
  },

  /**
   * Get withdrawal history
   */
  async getWithdrawalHistory(): Promise<WithdrawalTransaction[]> {
    return apiClient.get<WithdrawalTransaction[]>('/withdrawals')
  },
}
