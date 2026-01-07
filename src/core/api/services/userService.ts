/**
 * User Service
 * Handles user-related API calls
 */

import { apiClient } from '../client'
import type { User, UpdateUserRequest, PaginatedResponse } from '../types'

export const userService = {
  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    return apiClient.get<User>('/users/me')
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
}

