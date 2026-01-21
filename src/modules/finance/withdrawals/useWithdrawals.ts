/**
 * Withdrawal Hooks
 * React Query hooks for withdrawal and payment method management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { withdrawalService } from './withdrawalService'
import type { CreatePaymentMethodRequest, WithdrawalRequest } from '@/core/api/types'

export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => withdrawalService.getWalletBalance(),
  })
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => withdrawalService.getPaymentMethods(),
  })
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePaymentMethodRequest) => withdrawalService.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePaymentMethodRequest> }) =>
      withdrawalService.updatePaymentMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => withdrawalService.deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => withdrawalService.setDefaultPaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WithdrawalRequest) => withdrawalService.requestWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] })
    },
  })
}

export function useWithdrawalHistory() {
  return useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => withdrawalService.getWithdrawalHistory(),
  })
}
