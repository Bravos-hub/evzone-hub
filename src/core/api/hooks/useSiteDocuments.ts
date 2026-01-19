/**
 * Site Document Hooks
 * React Query hooks for site document management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { siteDocumentService } from '../services/siteDocumentService'
import { queryKeys } from '@/data/queryKeys'

export function useSiteDocuments(siteId: string) {
    return useQuery({
        queryKey: queryKeys.sites.documents(siteId),
        queryFn: () => siteDocumentService.getAll(siteId),
        enabled: !!siteId,
    })
}

export function useUploadSiteDocument() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ siteId, title, file }: { siteId: string; title: string; file: File }) =>
            siteDocumentService.upload(siteId, title, file),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sites.documents(variables.siteId) })
        },
    })
}

export function useDeleteSiteDocument() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ siteId, documentId }: { siteId: string; documentId: string }) =>
            siteDocumentService.delete(siteId, documentId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sites.documents(variables.siteId) })
        },
    })
}
