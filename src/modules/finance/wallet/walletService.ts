/**
 * Wallet Service
 * Handles wallet-related API calls
 */

import { apiClient } from '../client'
import type { WalletBalance, WalletTransaction, TopUpRequest } from '../types'

export const walletService = {
  /**
   * Get wallet balance
   */
  async getBalance(): Promise<WalletBalance> {
    return apiClient.get<WalletBalance>('/wallet/balance')
  },

  /**
   * Get wallet transactions
   */
  async getTransactions(): Promise<WalletTransaction[]> {
    return apiClient.get<WalletTransaction[]>('/wallet/transactions')
  },

  /**
   * Top up wallet
   */
  async topUp(data: TopUpRequest): Promise<WalletTransaction> {
    return apiClient.post<WalletTransaction>('/wallet/topup', data)
  },

  /**
   * Lock wallet
   */
  async lock(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/wallet/lock')
  },

  /**
   * Unlock wallet
   */
  async unlock(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/wallet/unlock')
  },

  /**
   * Transfer funds
   */
  async transfer(toUserId: string, amount: number, description: string): Promise<WalletTransaction> {
    return apiClient.post<WalletTransaction>('/wallet/transfer', { toUserId, amount, description })
  },
}

