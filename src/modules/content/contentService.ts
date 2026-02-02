/**
 * Content Service
 * Handles CMS/content-related API calls
 */

import { apiClient } from '@/core/api/client'

export interface ContentItem {
  id: string
  title: string
  type: string
  locale?: string
  updatedAt?: string
  status?: string
  author?: string
}

export const contentService = {
  async getAll(filters?: { type?: string; status?: string; locale?: string }): Promise<ContentItem[]> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.locale) params.append('locale', filters.locale)

    const queryString = params.toString()
    return apiClient.get<ContentItem[]>(`/content${queryString ? `?${queryString}` : ''}`)
  },
}
