/**
 * Webhook Hooks
 * React Query hooks for webhook management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { webhookService, type CreateWebhookRequest, type UpdateWebhookRequest } from '../services/webhookService'

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks', 'all'],
    queryFn: () => webhookService.getAll(),
  })
}

export function useWebhook(id: string) {
  return useQuery({
    queryKey: ['webhooks', 'detail', id],
    queryFn: () => webhookService.getById(id),
    enabled: !!id,
  })
}

export function useCreateWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateWebhookRequest) => webhookService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'all'] })
    },
  })
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWebhookRequest }) =>
      webhookService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'all'] })
    },
  })
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhookService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'all'] })
    },
  })
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (id: string) => webhookService.test(id),
  })
}
