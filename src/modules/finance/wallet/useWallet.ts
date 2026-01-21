/**
 * Wallet Hooks
 * React Query hooks for wallet management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletService } from '../services/walletService'
import { queryKeys } from '@/data/queryKeys'
import type { TopUpRequest } from '../types'

export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.wallet.balance,
    queryFn: () => walletService.getBalance(),
  })
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: queryKeys.wallet.transactions,
    queryFn: () => walletService.getTransactions(),
  })
}

export function useTopUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TopUpRequest) => walletService.topUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance })
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions })
    },
  })
}

export function useLockWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => walletService.lock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance })
    },
  })
}

export function useUnlockWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => walletService.unlock(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance })
    },
  })
}

export function useTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ toUserId, amount, description }: { toUserId: string; amount: number; description: string }) =>
      walletService.transfer(toUserId, amount, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance })
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions })
    },
  })
}

