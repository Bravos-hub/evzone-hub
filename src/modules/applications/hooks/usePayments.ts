/**
 * Payment Hooks
 * React Query hooks for payment management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentService } from '../services'
import type { InitiatePaymentRequest, ConfirmPaymentRequest } from '../types'

/**
 * Initiate a payment
 */
export function useInitiatePayment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: InitiatePaymentRequest) => paymentService.initiate(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['applications', variables.applicationId] })
        },
    })
}

/**
 * Poll payment status
 */
export function usePaymentStatus(paymentId: string, options?: { refetchInterval?: number }) {
    return useQuery({
        queryKey: ['payments', paymentId],
        queryFn: () => paymentService.getStatus(paymentId),
        enabled: !!paymentId,
        refetchInterval: options?.refetchInterval || 5000, // Poll every 5 seconds by default
    })
}

/**
 * Admin: Confirm manual payment
 */
export function useConfirmPayment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: ConfirmPaymentRequest) => paymentService.confirm(data),
        onSuccess: (payment) => {
            queryClient.invalidateQueries({ queryKey: ['payments', payment.id] })
            queryClient.invalidateQueries({ queryKey: ['applications', payment.applicationId] })
        },
    })
}

/**
 * Download payment receipt
 */
export function useDownloadReceipt() {
    return useMutation({
        mutationFn: async (paymentId: string) => {
            const blob = await paymentService.getReceipt(paymentId)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `receipt-${paymentId}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        },
    })
}
