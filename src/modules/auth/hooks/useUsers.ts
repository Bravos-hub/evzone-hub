/**
 * User Hooks
 * React Query hooks for user management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService, resolveUserOrgId } from '../services/userService'
import type { UserListFilters } from '../services/userService'
import { queryKeys } from '@/data/queryKeys'
import type { UpdateUserRequest, InviteUserRequest } from '@/core/api/types'
import { useAuthStore } from '@/core/auth/authStore'
import { ROLE_GROUPS } from '@/constants/roles'

export function useUsers(filters?: UserListFilters) {
  const { user: currentUser } = useAuthStore()
  const viewerId = currentUser?.id
  const viewerRole = currentUser?.role
  const viewerOrgId = currentUser?.orgId || currentUser?.organizationId
  const hasGlobalVisibility = viewerRole ? ROLE_GROUPS.PLATFORM_OPS.includes(viewerRole) : false

  const effectiveFilters =
    hasGlobalVisibility || !viewerOrgId
      ? filters
      : { ...filters, orgId: viewerOrgId, organizationId: viewerOrgId }

  return useQuery({
    queryKey: queryKeys.users.list({
      ...effectiveFilters,
      __viewerId: viewerId ?? null,
      __viewerRole: viewerRole ?? null,
      __viewerOrgId: viewerOrgId ?? null,
      __global: hasGlobalVisibility,
    }),
    queryFn: () => userService.getAll(effectiveFilters),
    select: (users) => {
      if (hasGlobalVisibility) return users
      if (!viewerId) return []

      return users.filter((user) => {
        if (user.id === viewerId) return true
        if (!viewerOrgId) return false
        return resolveUserOrgId(user) === viewerOrgId
      })
    },
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

export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteUserRequest) => userService.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (id: string) => userService.requestPasswordReset(id),
  })
}

export function useForceLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userService.forceLogout(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
    },
  })
}

export function useToggleMfaRequirement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, required }: { id: string; required: boolean }) =>
      userService.toggleMfaRequirement(id, required),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
    },
  })
}
