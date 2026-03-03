import { apiClient } from '@/core/api/client'
import type {
  StaffPayoutProfile,
  StationContextSummary,
  StationRoleAssignment,
  TeamInviteRequest,
  TeamMember,
  UpdateUserRequest,
} from '@/core/api/types'

type TeamAssignmentsResponse = {
  userId: string
  assignments: StationRoleAssignment[]
}

type StationContextBundle = {
  stationContexts: StationContextSummary[]
  activeStationContext: StationContextSummary | null
}

export const teamService = {
  async getTeamMembers(): Promise<TeamMember[]> {
    return apiClient.get<TeamMember[]>('/users/team')
  },

  async inviteTeamMember(payload: TeamInviteRequest): Promise<{
    success: boolean
    inviteId: string
    expiresAt: string
    isExistingUser: boolean
  }> {
    return apiClient.post('/users/team/invite', payload)
  },

  async updateTeamMember(id: string, payload: UpdateUserRequest): Promise<TeamMember> {
    return apiClient.patch<TeamMember>(`/users/team/${id}`, payload)
  },

  async getAssignments(id: string): Promise<TeamAssignmentsResponse> {
    return apiClient.get<TeamAssignmentsResponse>(`/users/team/${id}/assignments`)
  },

  async replaceAssignments(id: string, assignments: StationRoleAssignment[]): Promise<TeamAssignmentsResponse> {
    return apiClient.put<TeamAssignmentsResponse>(`/users/team/${id}/assignments`, {
      assignments,
    })
  },

  async getPayoutProfile(id: string): Promise<StaffPayoutProfile | null> {
    return apiClient.get<StaffPayoutProfile | null>(`/users/team/${id}/payout-profile`)
  },

  async upsertPayoutProfile(id: string, payload: StaffPayoutProfile): Promise<StaffPayoutProfile> {
    return apiClient.put<StaffPayoutProfile>(`/users/team/${id}/payout-profile`, payload)
  },

  async getMyStationContexts(): Promise<StationContextBundle> {
    return apiClient.get<StationContextBundle>('/users/me/station-contexts')
  },

  async switchMyStationContext(assignmentId: string): Promise<StationContextBundle> {
    return apiClient.post<StationContextBundle>('/users/me/station-context', {
      assignmentId,
    })
  },
}
