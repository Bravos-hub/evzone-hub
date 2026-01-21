/**
 * Notification Service
 * Handles notification-related API calls
 */

import { apiClient } from '../client'
import type { NotificationItem } from '../types'

export const notificationService = {
  /**
   * Get notifications for the current user
   */
  async getNotifications(): Promise<NotificationItem[]> {
    return apiClient.get<NotificationItem[]>('/notifications')
  },
}
