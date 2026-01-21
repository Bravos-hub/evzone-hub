/**
 * Site Hooks
 * React Query hooks for site management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { siteService } from '../services/siteService'
import { queryKeys } from '@/data/queryKeys'
import type { CreateSiteRequest, UpdateSiteRequest } from '@/core/api/types'

export function useSites(filters?: { status?: string; city?: string; myOnly?: boolean }) {
  return useQuery({
    queryKey: queryKeys.sites.all(filters),
    queryFn: () => siteService.getSites(filters),
  })
}

export function useSite(id: string) {
  return useQuery({
    queryKey: queryKeys.sites.detail(id),
    queryFn: () => siteService.getSite(id),
    enabled: !!id,
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSiteRequest) => siteService.createSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all() })
    },
  })
}

export function useUpdateSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSiteRequest }) =>
      siteService.updateSite(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all() })
    },
  })
}

export function useDeleteSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => siteService.deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all() })
    },
  })
}

export function useSiteStats(id: string) {
  return useQuery({
    queryKey: queryKeys.sites.stats(id),
    queryFn: () => siteService.getSiteStats(id),
    enabled: !!id,
  })
}
