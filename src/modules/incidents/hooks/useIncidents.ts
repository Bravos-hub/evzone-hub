import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { incidentService } from '../services/incidentService'
import { queryKeys } from '@/data/queryKeys'
import type { IncidentStatus } from '@/core/api/types'

export function useIncidents(filters?: { status?: string; severity?: string }) {
  return useQuery({
    queryKey: ['incidents', 'all', filters],
    queryFn: () => incidentService.getAll(),
  })
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ['incidents', 'detail', id],
    queryFn: () => incidentService.getById(id),
    enabled: !!id,
  })
}

export function useAssignIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { assignedTo: string } }) =>
      incidentService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', variables.id] })
    },
  })
}

export function useCreateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => incidentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] })
    },
  })
}

export function useResolveIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string; data?: any }) =>
      incidentService.updateStatus(id, 'RESOLVED'),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', variables.id] })
    },
  })
}

export function useAddIncidentNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ incidentId, data }: { incidentId: string; data: { content: string; authorId: string; authorName: string } }) =>
      incidentService.addNote(incidentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', variables.incidentId] })
    },
  })
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ incidentId, status }: { incidentId: string; status: IncidentStatus }) =>
      incidentService.updateStatus(incidentId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', variables.incidentId] })
    },
  })
}
