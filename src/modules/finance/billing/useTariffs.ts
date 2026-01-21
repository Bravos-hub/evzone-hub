/**
 * Tariff Hooks
 * React Query hooks for tariff management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tariffService } from './tariffService'
import { queryKeys } from '@/data/queryKeys'

export function useTariffs(filters?: { orgId?: string; status?: string }) {
    return useQuery({
        queryKey: queryKeys.tariffs.all(filters),
        queryFn: () => tariffService.getAll(filters),
    })
}

export function useTariff(id: string) {
    return useQuery({
        queryKey: queryKeys.tariffs.detail(id),
        queryFn: () => tariffService.getById(id),
        enabled: !!id,
    })
}

export function useCreateTariff() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: any) => tariffService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.all() })
        },
    })
}

export function useUpdateTariff() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => tariffService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.all() })
        },
    })
}

export function useDeleteTariff() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => tariffService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.all() })
        },
    })
}

export function useActivateTariff() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => tariffService.activate(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.detail(id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.tariffs.all() })
        },
    })
}
