/**
 * Notice Service
 * Handles notice-related API calls
 */

import { apiClient } from '@/core/api/client'
import type { NoticeRequest, Notice } from '@/core/api/types'

export const noticeService = {
  /**
   * Send a notice to a tenant
   */
  async sendNotice(data: NoticeRequest): Promise<Notice> {
    return apiClient.post<Notice>('/notices', data)
  },

  /**
   * Get all notices sent by the site owner
   */
  async getNotices(tenantId?: string): Promise<Notice[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : ''
    return apiClient.get<Notice[]>(`/notices${params}`)
  },
}
