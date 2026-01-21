/**
 * Document Hooks
 * React Query hooks for document management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentService } from '../services'
import type { DocumentUploadRequest, DocumentListFilters } from '../types'

/**
 * Fetch documents for a site or application
 */
export function useDocuments(
    entityType: 'site' | 'application',
    entityId: string,
    filters?: DocumentListFilters
) {
    return useQuery({
        queryKey: ['documents', entityType, entityId, filters],
        queryFn: () => documentService.list(entityType, entityId, filters),
        enabled: !!entityId,
    })
}

/**
 * Upload a document
 */
export function useUploadDocument(entityType: 'site' | 'application', entityId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: DocumentUploadRequest) =>
            documentService.upload(entityType, entityId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] })
        },
    })
}

/**
 * Delete a document
 */
export function useDeleteDocument(entityType: 'site' | 'application', entityId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (docId: string) =>
            documentService.delete(entityType, entityId, docId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] })
        },
    })
}

/**
 * Admin: Get all pending documents
 */
export function usePendingDocuments() {
    return useQuery({
        queryKey: ['documents', 'pending'],
        queryFn: () => documentService.getPending(),
    })
}

/**
 * Admin: Verify a document
 */
export function useVerifyDocument() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (docId: string) => documentService.verify(docId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] })
        },
    })
}

/**
 * Admin: Reject a document
 */
export function useRejectDocument() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ docId, reason }: { docId: string; reason: string }) =>
            documentService.reject(docId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] })
        },
    })
}
