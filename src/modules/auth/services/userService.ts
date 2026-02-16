/**
 * User Service
 * Handles user-related API calls
 */

import { apiClient } from '@/core/api/client'
import { DEMO_MODE } from '@/core/api/config'
import { ApiException } from '@/core/api/errors'
import type { User, UpdateUserRequest, InviteUserRequest } from '@/core/api/types'

export type UserListFilters = {
  q?: string
  role?: string
  status?: string
  region?: string
  zoneId?: string
  orgId?: string
  organizationId?: string
}

export function resolveUserOrgId(user?: Partial<User> | null): string | undefined {
  if (!user) return undefined
  return user.organization?.id || user.orgId || user.organizationId || user.tenantId || undefined
}

function normalizeMe(user: User): User {
  const resolvedOrgId = resolveUserOrgId(user)
  const assignedStations = user.assignedStations ?? []

  return {
    ...user,
    orgId: resolvedOrgId,
    organizationId: resolvedOrgId,
    assignedStations,
  }
}

function assertScopedFields(user: User): void {
  if (user.role !== 'STATION_OWNER' && user.role !== 'STATION_OPERATOR') return

  const missing: string[] = []
  const orgId = user.orgId || user.organizationId

  if (user.role === 'STATION_OWNER' && !orgId) {
    missing.push('orgId/organizationId')
  }

  if (!user.ownerCapability) {
    missing.push('ownerCapability')
  }

  if (user.role === 'STATION_OPERATOR' && user.assignedStations == null) {
    missing.push('assignedStations')
  }

  if (missing.length > 0) {
    throw new ApiException(
      `Missing required fields for ${user.role} on /users/me: ${missing.join(', ')}`,
      422
    )
  }
}

export const userService = {
  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    const user = await apiClient.get<User>('/users/me')
    const normalized = normalizeMe(user)
    if (!DEMO_MODE) {
      assertScopedFields(normalized)
    }
    return normalized
  },

  /**
   * Update current user profile
   */
  async updateMe(data: UpdateUserRequest): Promise<User> {
    return apiClient.patch<User>('/users/me', data)
  },

  /**
   * Get all users (admin only)
   */
  async getAll(filters?: UserListFilters): Promise<User[]> {
    const params = new URLSearchParams()
    if (filters?.q) params.append('q', filters.q)
    if (filters?.role) params.append('role', filters.role)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.region) params.append('region', filters.region)
    if (filters?.zoneId) params.append('zoneId', filters.zoneId)
    if (filters?.orgId) params.append('orgId', filters.orgId)
    if (filters?.organizationId) params.append('organizationId', filters.organizationId)

    const queryString = params.toString()
    const url = queryString ? `/users?${queryString}` : '/users'
    return apiClient.get<User[]>(url)
  },

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`)
  },

  /**
   * Update user by ID
   */
  async updateById(id: string, data: UpdateUserRequest): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, data)
  },

  /**
   * Delete user by ID
   */
  async deleteById(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`)
  },

  /**
   * Get user vehicles
   */
  async getUserVehicles(userId: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/users/${userId}/vehicles`)
  },

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/users/${userId}/sessions`)
  },
  /**
   * Invite a new user
   */
  async invite(data: InviteUserRequest): Promise<void> {
    return apiClient.post<void>('/users/invite', data)
  },
  /**
   * Security Action: Request password reset email
   */
  async requestPasswordReset(id: string): Promise<void> {
    return apiClient.post<void>(`/users/${id}/reset-password`)
  },
  /**
   * Security Action: Force logout (revoke sessions)
   */
  async forceLogout(id: string): Promise<void> {
    return apiClient.post<void>(`/users/${id}/force-logout`)
  },
  /**
   * Security Action: Toggle MFA requirement
   */
  async toggleMfaRequirement(id: string, required: boolean): Promise<void> {
    return apiClient.post<void>(`/users/${id}/mfa-requirement`, { required })
  },
}


