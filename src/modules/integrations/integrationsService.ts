/**
 * Integrations Service
 * Handles API keys & secrets endpoints
 */

import { apiClient } from '@/core/api/client'

export interface ApiKey {
  id: string
  name: string
  prefix?: string
  status?: string
  createdAt?: string
  lastUsedAt?: string
}

export interface IntegrationSecret {
  id: string
  name: string
  environment?: string
  lastRotatedAt?: string
}

export const integrationsService = {
  async getApiKeys(): Promise<ApiKey[]> {
    return apiClient.get<ApiKey[]>('/integrations/api-keys')
  },

  async getSecrets(): Promise<IntegrationSecret[]> {
    return apiClient.get<IntegrationSecret[]>('/integrations/secrets')
  },

  async rotateApiKey(id: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/integrations/api-keys/${id}/rotate`, {})
  },

  async revokeApiKey(id: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/integrations/api-keys/${id}/revoke`, {})
  },

  async rotateSecret(id: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(`/integrations/secrets/${id}/rotate`, {})
  },
}
