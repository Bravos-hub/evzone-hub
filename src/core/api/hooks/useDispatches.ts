/**
 * Dispatch Hooks
 * React Query hooks for dispatch management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dispatchService, type CreateDispatchRequest, type UpdateDispatchRequest, type AssignDispatchRequest } from '../services/dispatchService'

export function useDispatches(filters?: { status?: string; priority?: string; stationId?: string }) {
  return useQuery({
    queryKey: ['dispatches', 'all', filters],
    queryFn: () => dispatchService.getAll(filters),
  })
}

export function useDispatch(id: string) {
  return useQuery({
    queryKey: ['dispatches', 'detail', id],
    queryFn: () => dispatchService.getById(id),
    enabled: !!id,
  })
}

export function useCreateDispatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDispatchRequest) => dispatchService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches', 'all'] })
    },
  })
}

export function useUpdateDispatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDispatchRequest }) =>
      dispatchService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dispatches', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dispatches', 'all'] })
    },
  })
}

export function useAssignDispatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignDispatchRequest }) =>
      dispatchService.assign(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dispatches', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dispatches', 'all'] })
    },
  })
}

export function useDeleteDispatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => dispatchService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches', 'all'] })
    },
  })
}
