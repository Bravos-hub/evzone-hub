/**
 * Charge Point Hooks
 * React Query hooks for charge point management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chargePointService } from '../services/chargePointService'
import type { CreateChargePointRequest, UpdateChargePointRequest } from '../types'
import { queryKeys } from '@/data/queryKeys'

export function useChargePoints(filters?: { stationId?: string; status?: string }) {
  return useQuery({
    queryKey: ['chargePoints', 'all', filters],
    queryFn: () => chargePointService.getAll(filters),
  })
}

export function useChargePoint(id: string) {
  return useQuery({
    queryKey: ['chargePoints', 'detail', id],
    queryFn: () => chargePointService.getById(id),
    enabled: !!id,
  })
}

export function useChargePointsByStation(stationId: string) {
  return useQuery({
    queryKey: ['chargePoints', 'station', stationId],
    queryFn: () => chargePointService.getByStationId(stationId),
    enabled: !!stationId,
  })
}

export function useCreateChargePoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateChargePointRequest) => chargePointService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chargePoints', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['chargePoints', 'station', variables.stationId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.all() })
    },
  })
}

export function useUpdateChargePoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChargePointRequest }) =>
      chargePointService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chargePoints', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['chargePoints', 'all'] })
    },
  })
}

export function useDeleteChargePoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => chargePointService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargePoints', 'all'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.stations.all() })
    },
  })
}

export function useRebootChargePoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => chargePointService.reboot(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['chargePoints', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['chargePoints', 'all'] })
    },
  })
}
