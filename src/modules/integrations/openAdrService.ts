/**
 * OpenADR Service
 */

import { apiClient } from '@/core/api/client'

export interface OpenAdrEvent {
  id: string
  program?: string
  signal?: string
  level?: string
  start?: string
  end?: string
  sites?: number
  status?: string
}

export const openAdrService = {
  async getEvents(filters?: { status?: string; program?: string; signal?: string; from?: string; to?: string }): Promise<OpenAdrEvent[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.program) params.append('program', filters.program)
    if (filters?.signal) params.append('signal', filters.signal)
    if (filters?.from) params.append('from', filters.from)
    if (filters?.to) params.append('to', filters.to)
    const queryString = params.toString()
    return apiClient.get<OpenAdrEvent[]>(`/openadr/events${queryString ? `?${queryString}` : ''}`)
  },
}
