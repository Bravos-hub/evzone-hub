/**
 * Provider Hooks
 * React Query hooks for battery swapping provider management
 */

import { useQuery } from '@tanstack/react-query'
import { providerService } from '../services/providerService'
import { queryKeys } from '@/data/queryKeys'

export function useProviders(filters?: { region?: string; standard?: string; status?: string }) {
    return useQuery({
        queryKey: queryKeys.providers.all(filters),
        queryFn: () => providerService.getAll(filters),
    })
}

export function useProvider(id: string) {
    return useQuery({
        queryKey: queryKeys.providers.detail(id),
        queryFn: () => providerService.getById(id),
        enabled: !!id,
    })
}
