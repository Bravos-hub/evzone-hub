/**
 * User Service
 * Handles user-related API calls
 */

import { apiClient } from '../client'
import { DEMO_MODE } from '../config'
import { ApiException } from '../errors'
import type { User, UpdateUserRequest, PaginatedResponse, InviteUserRequest } from '../types'

function normalizeMe(user: User): User {
  const orgId = user.orgId || user.organizationId
  const organizationId = user.organizationId || user.orgId
  const assignedStations = user.assignedStations ?? []

  return {
    ...user,
    orgId,
    organizationId,
    assignedStations,
  }
}

function assertScopedFields(user: User): void {
  if (user.role !== 'OWNER' && user.role !== 'STATION_OPERATOR') return

  const missing: string[] = []
  const orgId = user.orgId || user.organizationId

  if (user.role === 'OWNER' && !orgId) {
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
  async getAll(): Promise<User[]> {
    return apiClient.get<User[]>('/users')
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
}

