/**
 * User Hooks
 * React Query hooks for user management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService } from '../services/userService'
import { queryKeys } from '@/data/queryKeys'
import { getErrorMessage } from '../errors'
import type { UpdateUserRequest } from '../types'

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => userService.getAll(),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userService.updateById(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => userService.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => userService.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export function useUserVehicles(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.vehicles(userId),
    queryFn: () => userService.getUserVehicles(userId),
    enabled: !!userId,
  })
}

export function useUserSessions(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.sessions(userId),
    queryFn: () => userService.getUserSessions(userId),
    enabled: !!userId,
  })
}

