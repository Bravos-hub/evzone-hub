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

// MOCK TENANT HOOKS (Temporary until backend endpoint exists)
import type { Tenant, LeaseContract } from '@/core/api/types'

export function useTenants(filters?: { siteId?: string }) {
    return useQuery({
        queryKey: ['tenants', filters],
        queryFn: async (): Promise<Tenant[]> => {
            // Mock data - in real app, filter by filters.siteId
            const allTenants = [
                {
                    id: 't-1',
                    name: 'SuperCharge Ops',
                    type: 'Operator',
                    status: 'Active',
                    siteId: 's-1',
                    siteName: 'Downtown Plaza',
                    model: 'Revenue Share', // Tenant type has model? Check type definition
                    terms: '5yr / 15%',
                    startDate: '2024-01-01',
                    earnings: 5400,
                    outstandingDebt: 0,
                    contactPerson: 'Alice',
                    email: 'alice@supercharge.com',
                    phone: '555-0101',
                    paymentHistory: []
                },
                {
                    id: 't-2',
                    name: 'GreenFleet',
                    type: 'Fleet',
                    status: 'Active',
                    siteId: 's-2',
                    siteName: 'Logistics Hub',
                    model: 'Fixed Rent',
                    terms: '$2,500/mo',
                    startDate: '2023-11-15',
                    earnings: 12000,
                    outstandingDebt: 2500,
                    contactPerson: 'Bob',
                    email: 'bob@greenfleet.com',
                    phone: '555-0102',
                    paymentHistory: []
                }
            ] as any[] as Tenant[]

            if (filters?.siteId) {
                return allTenants.filter(t => t.siteId === filters.siteId)
            }
            return allTenants
        }
    })
}

export function useTenant(id: string) {
    return useQuery({
        queryKey: ['tenants', id],
        queryFn: async (): Promise<Tenant> => {
            return {
                id,
                name: 'SuperCharge Ops',
                type: 'Operator',
                status: 'Active',
                siteId: 's-1',
                siteName: 'Downtown Plaza',
                model: 'Revenue Share',
                terms: '5yr / 15%',
                startDate: '2024-01-01',
                earnings: 5400,
                outstandingDebt: 0,
                contactPerson: 'Alice',
                email: 'alice@supercharge.com',
                phone: '555-0101',
                paymentHistory: []
            } as any as Tenant
        }
    })
}

export function useTenantContract(id: string) {
    return useQuery({
        queryKey: ['tenants', id, 'contract'],
        queryFn: async (): Promise<LeaseContract> => {
            return {
                id: 'c-1',
                tenantId: id,
                tenantName: 'SuperCharge Ops',
                status: 'Active',
                startDate: '2024-01-01',
                endDate: '2029-01-01',
                rent: 1500,
                currency: 'USD',
                paymentSchedule: 'Monthly',
                autoRenew: true,
                terms: 'Standard Commercial Lease',
                model: 'Revenue Share', // LeaseContract has model?
                violations: []
            } as any as LeaseContract
        }
    })
}

/** @deprecated Use useCreateApplication instead */
export const useSubmitApplication = useCreateApplication

/**
 * Generate lease agreement
 */
export function useGenerateLease() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => applicationService.generateLease(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['applications', id] })
        },
    })
}

/**
 * Send lease for signature
 */
export function useSendLeaseForSignature() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => applicationService.sendForSignature(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['applications', id] })
        },
    })
}

/**
 * Upload signed lease
 */
export function useUploadLease() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) => applicationService.uploadLease(id, file),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['applications', id] })
        },
    })
}

/**
 * Digitally sign lease
 */
export function useSignLease() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, signatureData }: { id: string; signatureData: string }) =>
            applicationService.signLease(id, signatureData),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['applications', id] })
        },
    })
}

/**
 * Propose new terms (Negotiation)
 */
export function useProposeTerms() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ applicationId, terms, message }: { applicationId: string; terms: any; message?: string }) =>
            import('../services/negotiationService').then(m => m.negotiationService.propose({ applicationId, terms, message })),
        onSuccess: (_, { applicationId }) => {
            queryClient.invalidateQueries({ queryKey: ['applications', applicationId] })
        },
    })
}

/**
 * Verify security deposit
 */
export function useVerifyDeposit() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => applicationService.verifySecurityDeposit(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['applications', id] })
        },
    })
}

/** @deprecated Use useApplications instead */
export const useUpdateApplicationTerms = useApproveApplication

