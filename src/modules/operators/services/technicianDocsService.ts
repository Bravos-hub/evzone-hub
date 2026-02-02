/**
 * Technician Docs Service
 * Handles technician documents API calls
 */

import { apiClient } from '@/core/api/client'

export interface TechnicianDocument {
  id: string
  title: string
  category?: string
  type?: string
  size?: number
  updatedAt?: string
  owner?: string
  url?: string
}

export const technicianDocsService = {
  async getAll(): Promise<TechnicianDocument[]> {
    return apiClient.get<TechnicianDocument[]>('/technicians/docs')
  },
}
