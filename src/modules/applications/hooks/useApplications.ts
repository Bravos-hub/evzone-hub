/**
 * Application Hooks
 * React Query hooks for application management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationService } from '../services'
import type {
    CreateApplicationRequest,
    UpdateApplicationStatusRequest,
    ApplicationListFilters,
} from '../types'


/**
 * Fetch list of applications
 */
export function useApplications(filters?: ApplicationListFilters) {
    return useQuery({
        queryKey: ['applications', filters],
        queryFn: () => applicationService.list(filters),
    })
}

/**
 * Fetch a single application
 */
export function useApplication(id: string) {
    return useQuery({
        queryKey: ['applications', id],
        queryFn: () => applicationService.getById(id),
        enabled: !!id,
    })
}

/**
 * Create a new application
 */
export function useCreateApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateApplicationRequest) => applicationService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
        },
    })
}

/**
 * Update application status
 */
export function useUpdateApplicationStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateApplicationStatusRequest }) =>
            applicationService.updateStatus(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
            queryClient.invalidateQueries({ queryKey: ['applications', variables.id] })
        },
    })
}

/**
 * Withdraw an application
 */
export function useWithdrawApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => applicationService.withdraw(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
        },
    })
}

/**
 * Admin: Approve application
 */
export function useApproveApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, message }: { id: string; message?: string }) =>
            applicationService.updateStatus(id, { status: 'APPROVED', message }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
            queryClient.invalidateQueries({ queryKey: ['applications', variables.id] })
        },
    })
}

/**
 * Admin: Reject application
 */
export function useRejectApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, message }: { id: string; message: string }) =>
            applicationService.updateStatus(id, { status: 'REJECTED', message }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['applications'] })
            queryClient.invalidateQueries({ queryKey: ['applications', variables.id] })
        },
    })
}

/**
 * Admin: Activate tenant from application
 */
export function useActivateTenant() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => applicationService.activate(id),
        onSuccess: (_, applicationId) => {
            queryClient.invalidateQueries({ queryKey: ['applications', applicationId] })
            queryClient.invalidateQueries({ queryKey: ['tenants'] })
        },
    })
}

// ============================================================================
// Backward Compatibility Exports
// ============================================================================
// These aliases maintain compatibility with code expecting old API

/** @deprecated Use useApplications instead */
export const useLeases = useApplications

/** @deprecated Use useApplications instead */
export const useTenant = useApplication

/** @deprecated Use useApplications instead */
export const useTenantContract = useApplication

/** @deprecated Use useApplications instead */
export const useTenants = useApplications

/** @deprecated Use useCreateApplication instead */
export const useSubmitApplication = useCreateApplication

/** @deprecated Use useApplications instead */
export const useUpdateApplicationTerms = useApproveApplication

