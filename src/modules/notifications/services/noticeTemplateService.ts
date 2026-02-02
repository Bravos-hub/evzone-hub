/**
 * Notice Template Service
 * Handles notice template API calls
 */

import { apiClient } from '@/core/api/client'

export interface NoticeTemplate {
  id: string
  name: string
  type?: string
  lastUsedAt?: string
}

export const noticeTemplateService = {
  async getTemplates(): Promise<NoticeTemplate[]> {
    return apiClient.get<NoticeTemplate[]>('/notices/templates')
  },
}
