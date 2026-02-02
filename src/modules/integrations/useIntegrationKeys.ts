/**
 * Integrations Hooks
 * React Query hooks for API keys & secrets
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { integrationsService } from './integrationsService'

export function useApiKeys() {
  return useQuery({
    queryKey: ['integrations', 'api-keys'],
    queryFn: () => integrationsService.getApiKeys(),
  })
}

export function useSecrets() {
  return useQuery({
    queryKey: ['integrations', 'secrets'],
    queryFn: () => integrationsService.getSecrets(),
  })
}

export function useRotateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => integrationsService.rotateApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'api-keys'] })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => integrationsService.revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'api-keys'] })
    },
  })
}

export function useRotateSecret() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => integrationsService.rotateSecret(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'secrets'] })
    },
  })
}
