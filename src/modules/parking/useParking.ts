/**
 * Parking Hooks
 * React Query hooks for parking bays
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parkingService, type CreateParkingBayRequest } from './parkingService'

export function useParkingBays(filters?: { siteId?: string; status?: string }) {
  return useQuery({
    queryKey: ['parking', 'bays', filters],
    queryFn: () => parkingService.getBays(filters),
  })
}

export function useCreateParkingBay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateParkingBayRequest) => parkingService.createBay(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking', 'bays'] })
    },
  })
}

export function useDeleteParkingBay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => parkingService.deleteBay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking', 'bays'] })
    },
  })
}
