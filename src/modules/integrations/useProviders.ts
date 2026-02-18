/**
 * Provider Hooks
 * React Query hooks for battery swapping provider management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { providerService } from './providerService'
import { queryKeys } from '@/data/queryKeys'
import type {
    CreateProviderDocumentRequest,
    CreateProviderRelationshipRequest,
    CreateSwapProviderRequest,
    ProviderDocumentStatus,
    ProviderRequirementScope,
    UpdateSwapProviderRequest,
} from '@/core/api/types'
import type { ProviderListFilters } from './providerService'

type QueryOptions = {
    enabled?: boolean
}

export function useProviders(filters?: ProviderListFilters, options?: QueryOptions) {
    return useQuery({
        queryKey: queryKeys.providers.all(filters),
        queryFn: () => providerService.getAll(filters),
        enabled: options?.enabled ?? true,
    })
}

export function useProvider(id: string) {
    return useQuery({
        queryKey: queryKeys.providers.detail(id),
        queryFn: () => providerService.getById(id),
        enabled: !!id,
    })
}

export function useEligibleProviders(ownerOrgId?: string) {
    return useQuery({
        queryKey: queryKeys.providers.eligible(ownerOrgId),
        queryFn: () => providerService.getEligibleForOwner(ownerOrgId),
        enabled: !!ownerOrgId,
    })
}

export function useProviderDocuments(filters?: { providerId?: string; relationshipId?: string; my?: boolean }) {
    return useQuery({
        queryKey: queryKeys.providers.documents(filters),
        queryFn: () => providerService.listDocuments(filters),
    })
}

export function useProviderRequirements(filters?: { appliesTo?: ProviderRequirementScope }) {
    return useQuery({
        queryKey: queryKeys.providers.requirements(filters),
        queryFn: () => providerService.getRequirementCatalog(filters),
    })
}

export function useProviderComplianceStatus(providerId: string, options?: QueryOptions) {
    return useQuery({
        queryKey: queryKeys.providers.compliance(providerId),
        queryFn: () => providerService.getComplianceStatus(providerId),
        enabled: (options?.enabled ?? true) && !!providerId,
    })
}

export function useProviderRelationships(
    filters?: { ownerOrgId?: string; providerId?: string; status?: string; my?: boolean },
    options?: QueryOptions
) {
    return useQuery({
        queryKey: queryKeys.providers.relationships(filters),
        queryFn: () => providerService.getRelationships(filters),
        enabled: options?.enabled ?? true,
    })
}

export function useProviderSettlementSummary(filters?: { providerId?: string; ownerOrgId?: string; startDate?: string; endDate?: string; my?: boolean }) {
    return useQuery({
        queryKey: queryKeys.providers.settlements(filters),
        queryFn: () => providerService.getSettlementSummary(filters),
    })
}

export function useCreateProvider() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateSwapProviderRequest) => providerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() })
        },
    })
}

export function useUpdateProvider() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateSwapProviderRequest }) => providerService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() })
        },
    })
}

export function useSubmitProviderForReview() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => providerService.submitForReview(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.detail(id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() })
        },
    })
}

export function useApproveProvider() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) => providerService.approve(id, notes),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() })
        },
    })
}

export function useRejectProvider() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => providerService.reject(id, reason),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() })
        },
    })
}

export function useSuspendProvider() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => providerService.suspend(id, reason),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() })
        },
    })
}

export function useUploadProviderDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateProviderDocumentRequest & { providerId?: string; relationshipId?: string }) =>
            providerService.uploadDocument(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.documents() })
            if (result.providerId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.providers.compliance(result.providerId) })
            }
        },
    })
}

export function useReviewProviderDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            status,
            reviewNotes,
            rejectionReason,
            reviewedBy,
        }: {
            id: string
            status: ProviderDocumentStatus
            reviewNotes?: string
            rejectionReason?: string
            reviewedBy?: string
        }) =>
            providerService.reviewDocument(id, {
                status,
                reviewNotes,
                rejectionReason,
                reviewedBy,
            }),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.documents() })
            if (result.providerId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.providers.compliance(result.providerId) })
            }
        },
    })
}

export function useDeleteProviderDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => providerService.deleteDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.documents() })
        },
    })
}

export function useRequestProviderRelationship() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateProviderRelationshipRequest) => providerService.requestRelationship(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.relationships() })
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.eligible() })
        },
    })
}

export function useRespondToProviderRelationship() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, action, notes }: { id: string; action: 'ACCEPT' | 'REJECT'; notes?: string }) =>
            providerService.respondToRelationship(id, action, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.relationships() })
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.eligible() })
        },
    })
}

export function useApproveProviderRelationship() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) => providerService.approveRelationship(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.relationships() })
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.eligible() })
        },
    })
}

export function useSuspendProviderRelationship() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => providerService.suspendRelationship(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.relationships() })
            queryClient.invalidateQueries({ queryKey: queryKeys.providers.eligible() })
        },
    })
}
