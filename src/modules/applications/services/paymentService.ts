/**
 * Payment Service
 * Handles security deposits and lease payments
 */

import { apiClient } from '@/core/api/client'
import { API_CONFIG } from '@/core/api/config'
import type {
    Payment,
    InitiatePaymentRequest,
    InitiatePaymentResponse,
    ConfirmPaymentRequest,
} from '../types'

export const paymentService = {
    /**
     * Initiate a payment (deposit, rent, etc.)
     */
    async initiate(data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
        const { applicationId, ...paymentData } = data
        return apiClient.post(`/applications/${applicationId}/payment`, paymentData)
    },

    /**
     * Get payment status
     */
    async getStatus(paymentId: string): Promise<Payment> {
        return apiClient.get<Payment>(`/payments/${paymentId}/status`)
    },

    /**
     * Admin: Manually confirm payment (for bank transfers)
     */
    async confirm(data: ConfirmPaymentRequest): Promise<Payment> {
        const { paymentId, ...confirmData } = data

        // If receipt file included, send as FormData
        if (confirmData.receiptFile) {
            const formData = new FormData()
            formData.append('file', confirmData.receiptFile)
            if (confirmData.transactionId) {
                formData.append('transactionId', confirmData.transactionId)
            }
            return apiClient.post<Payment>(`/payments/${paymentId}/confirm`, formData)
        }

        return apiClient.post<Payment>(`/payments/${paymentId}/confirm`, confirmData)
    },

    /**
     * Download payment receipt
     */
    async getReceipt(paymentId: string): Promise<Blob> {
        const response = await fetch(`${API_CONFIG.baseURL}/payments/${paymentId}/receipt`, {
            credentials: 'include',
        })
        if (!response.ok) {
            throw new Error(`Failed to download receipt: ${response.statusText}`)
        }
        return response.blob()
    },
}
