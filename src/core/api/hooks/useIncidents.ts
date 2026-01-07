/**
 * Incident Hooks
 * React Query hooks for incident management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { incidentService, type CreateIncidentRequest, type UpdateIncidentRequest, type AssignIncidentRequest, type ResolveIncidentRequest } from '../services/incidentService'

export function useIncidents(filters?: { status?: string; severity?: string; stationId?: string }) {
  return useQuery({
    queryKey: ['incidents', 'all', filters],
    queryFn: () => incidentService.getAll(filters),
  })
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ['incidents', 'detail', id],
    queryFn: () => incidentService.getById(id),
    enabled: !!id,
  })
}

export function useCreateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIncidentRequest) => incidentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] })
    },
  })
}

export function useUpdateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncidentRequest }) =>
      incidentService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] })
    },
  })
}

export function useAssignIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignIncidentRequest }) =>
      incidentService.assign(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] })
    },
  })
}

export function useResolveIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ResolveIncidentRequest }) =>
      incidentService.resolve(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] })
    },
  })
}

export function useDeleteIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => incidentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] })
    },
  })
}
