/**
 * Organization Hooks
 * React Query hooks for organization management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { organizationService } from '../services/organizationService'
import { queryKeys } from '@/data/queryKeys'
import type { CreateOrganizationRequest } from '../types'

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations.all,
    queryFn: () => organizationService.getAll(),
  })
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(id),
    queryFn: () => organizationService.getById(id),
    enabled: !!id,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOrganizationRequest) => organizationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all })
    },
  })
}

