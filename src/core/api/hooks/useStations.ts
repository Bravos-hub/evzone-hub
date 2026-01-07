/**
 * Station Hooks
 * React Query hooks for station management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { stationService } from '../services/stationService'
import { queryKeys } from '@/data/queryKeys'
import type { CreateStationRequest, UpdateStationRequest } from '../types'

export function useStations(filters?: { status?: string; orgId?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.stations.all(filters),
    queryFn: () => stationService.getAll(filters),
  })
}

export function useStation(id: string) {
  return useQuery({
    queryKey: queryKeys.stations.detail(id),
    queryFn: () => stationService.getById(id),
    enabled: !!id,
  })
}

export function useStationByCode(code: string) {
  return useQuery({
    queryKey: queryKeys.stations.byCode(code),
    queryFn: () => stationService.getByCode(code),
    enabled: !!code,
  })
}

export function useNearbyStations(lat: number, lng: number, radius?: number, limit?: number) {
  return useQuery({
    queryKey: queryKeys.stations.nearby(lat, lng, radius),
    queryFn: () => stationService.getNearby(lat, lng, radius, limit),
    enabled: !!lat && !!lng,
  })
}

export function useStationStats(id: string) {
  return useQuery({
    queryKey: queryKeys.stations.stats(id),
    queryFn: () => stationService.getStats(id),
    enabled: !!id,
  })
}

export function useCreateStation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStationRequest) => stationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.all() })
    },
  })
}

export function useUpdateStation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStationRequest }) =>
      stationService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.all() })
    },
  })
}

export function useDeleteStation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => stationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.all() })
    },
  })
}

export function useUpdateStationHealth() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => stationService.updateHealth(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.stats(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.detail(id) })
    },
  })
}

