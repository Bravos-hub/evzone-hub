import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/data/queryKeys'
import { teamService } from '@/modules/auth/services/teamService'
import type {
  StaffPayoutProfile,
  StationRoleAssignment,
  TeamInviteRequest,
  UpdateUserRequest,
} from '@/core/api/types'

export function useTeamMembers() {
  return useQuery({
    queryKey: queryKeys.team.members,
    queryFn: () => teamService.getTeamMembers(),
  })
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TeamInviteRequest) => teamService.inviteTeamMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.members })
    },
  })
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) =>
      teamService.updateTeamMember(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.members })
    },
  })
}

export function useTeamAssignments(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.team.assignments(userId),
    queryFn: () => teamService.getAssignments(userId),
    enabled: Boolean(userId) && enabled,
  })
}

export function useReplaceTeamAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, assignments }: { userId: string; assignments: StationRoleAssignment[] }) =>
      teamService.replaceAssignments(userId, assignments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.team.assignments(variables.userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.team.stationContexts })
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}

export function useTeamPayoutProfile(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.team.payoutProfile(userId),
    queryFn: () => teamService.getPayoutProfile(userId),
    enabled: Boolean(userId) && enabled,
  })
}

export function useUpsertTeamPayoutProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: StaffPayoutProfile }) =>
      teamService.upsertPayoutProfile(userId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.team.payoutProfile(variables.userId) })
    },
  })
}

export function useStationContexts() {
  return useQuery({
    queryKey: queryKeys.team.stationContexts,
    queryFn: () => teamService.getMyStationContexts(),
  })
}

export function useSwitchStationContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) => teamService.switchMyStationContext(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.stationContexts })
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}
