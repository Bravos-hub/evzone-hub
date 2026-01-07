/**
 * Tenant Hooks
 * React Query hooks for tenant management
 */

import { useQuery } from '@tanstack/react-query'
import { tenantService } from '../services/tenantService'

export function useTenants(filters?: { status?: string; siteId?: string }) {
  return useQuery({
    queryKey: ['tenants', filters],
    queryFn: () => tenantService.getAll(filters),
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
