import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CreatePartnerRequest,
  PartnerQuery,
  UpdatePartnerRequest,
  partnersService,
} from '../services/partnersService'

export function usePartners(query?: PartnerQuery) {
  return useQuery({
    queryKey: ['partners', query],
    queryFn: () => partnersService.getAll(query),
  })
}

export function useCreatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePartnerRequest) => partnersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}

export function useUpdatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePartnerRequest }) =>
      partnersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}

export function useSuspendPartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => partnersService.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}

export function useSyncPartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => partnersService.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}
