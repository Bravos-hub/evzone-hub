/**
 * Notification Hooks
 * React Query hooks for notification management
 */

import { useQuery } from '@tanstack/react-query'
import { notificationService } from '../services/notificationService'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  })
}
