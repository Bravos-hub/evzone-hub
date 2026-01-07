/**
 * Auth Hooks
 * React Query hooks for authentication
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/core/auth/authStore'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { queryKeys } from '@/data/queryKeys'
import { getErrorMessage } from '../errors'
import type { LoginRequest, RegisterRequest } from '../types'

export function useLogin() {
  const queryClient = useQueryClient()
  const { loginWithResponse } = useAuthStore()

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      loginWithResponse(response)
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
    onError: (error) => {
      console.error('Login error:', error)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  const { loginWithResponse } = useAuthStore()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response) => {
      loginWithResponse(response)
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
    onError: (error) => {
      console.error('Register error:', error)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const { logout: storeLogout } = useAuthStore()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      storeLogout()
      queryClient.clear()
    },
    onError: (error) => {
      console.error('Logout error:', error)
      // Still clear local state even if API call fails
      storeLogout()
      queryClient.clear()
    },
  })
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => userService.getMe(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

