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

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['applications', 'detail', id],
    queryFn: () => tenantService.getApplicationById(id),
    enabled: !!id,
  })
}

export function useApproveApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      tenantService.updateApplicationStatus(id, 'APPROVED', message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

export function useRejectApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      tenantService.updateApplicationStatus(id, 'REJECTED', message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useTenantContract(tenantId: string) {
  return useQuery({
    queryKey: ['tenants', 'contract', tenantId],
    queryFn: () => tenantService.getContract(tenantId),
    enabled: !!tenantId,
  })
}

export function useSubmitApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => tenantService.submitApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, file, category, documentType, required }: {
      applicationId: string
      file: File
      category: string
      documentType: string
      required: boolean
    }) => tenantService.uploadDocument(applicationId, file, category, documentType, required),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications', variables.applicationId] })
    },
  })
}

export function useUpdateApplicationTerms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, terms }: { id: string; terms: any }) =>
      tenantService.updateApplicationTerms(id, terms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}
