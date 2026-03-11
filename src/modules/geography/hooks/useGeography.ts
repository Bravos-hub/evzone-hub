import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  geographyService,
  type CreateGeographicZoneRequest,
  type GeographicZonesQuery,
  type UpdateGeographicZoneRequest,
} from '@/core/api/geographyService'
import { queryKeys } from '@/data/queryKeys'

export function useGeographicZones(query?: GeographicZonesQuery) {
  return useQuery({
    queryKey: queryKeys.geography.zones(query as Record<string, unknown> | undefined),
    queryFn: () => geographyService.getZones(query),
  })
}

export function useGeographicZone(id?: string) {
  return useQuery({
    queryKey: queryKeys.geography.detail(id || ''),
    queryFn: () => geographyService.getZoneById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateGeographicZone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateGeographicZoneRequest) =>
      geographyService.createZone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geography'] })
    },
  })
}

export function useUpdateGeographicZone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGeographicZoneRequest }) =>
      geographyService.updateZone(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['geography'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.geography.detail(variables.id) })
    },
  })
}

export function useUpdateGeographicZoneStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      geographyService.updateZoneStatus(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['geography'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.geography.detail(variables.id) })
    },
  })
}
