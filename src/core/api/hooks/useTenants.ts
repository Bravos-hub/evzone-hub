/**
 * Tenant Hooks
 * React Query hooks for tenant management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantService } from '../services/tenantService'

export function useTenants(filters?: { status?: string; siteId?: string }) {
  return useQuery({
    queryKey: ['tenants', filters],
    queryFn: () => tenantService.getLeases(filters), // Default useTenants to leases
  })
}

export function useApplications(filters?: { status?: string; siteId?: string }) {
  return useQuery({
    queryKey: ['applications', filters],
    queryFn: () => tenantService.getApplications(filters),
  })
}

export function useLeases(filters?: { status?: string; siteId?: string }) {
  return useQuery({
    queryKey: ['tenants', 'leases', filters],
    queryFn: () => tenantService.getLeases(filters),
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, message }: { id: string; status: string; message?: string }) =>
      tenantService.updateApplicationStatus(id, status, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['tenants', 'detail', id],
    queryFn: () => tenantService.getById(id),
    enabled: !!id,
  })
}

export function useTenantContract(tenantId: string) {
  return useQuery({
    queryKey: ['tenants', 'contract', tenantId],
    queryFn: () => tenantService.getContract(tenantId),
    enabled: !!tenantId,
  })
}
