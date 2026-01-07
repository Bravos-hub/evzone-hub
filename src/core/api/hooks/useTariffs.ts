/**
 * Tariff Hooks
 * React Query hooks for tariff management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tariffService, type CreateTariffRequest, type UpdateTariffRequest } from '../services/tariffService'

export function useTariffs(filters?: { active?: boolean }) {
  return useQuery({
    queryKey: ['tariffs', 'all', filters],
    queryFn: () => tariffService.getAll(filters),
  })
}

export function useTariff(id: string) {
  return useQuery({
    queryKey: ['tariffs', 'detail', id],
    queryFn: () => tariffService.getById(id),
    enabled: !!id,
  })
}

export function useCreateTariff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTariffRequest) => tariffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs', 'all'] })
    },
  })
}

export function useUpdateTariff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTariffRequest }) =>
      tariffService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tariffs', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['tariffs', 'all'] })
    },
  })
}

export function useDeleteTariff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tariffService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs', 'all'] })
    },
  })
}
