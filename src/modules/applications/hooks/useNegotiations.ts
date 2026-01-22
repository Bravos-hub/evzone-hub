/**
 * Negotiation Hooks
 * React Query hooks for lease term negotiations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { negotiationService } from '../services'
import type { ProposeTermsRequest, LeaseTerms } from '../types'

/**
 * Fetch negotiation history
 */
export function useNegotiationHistory(applicationId: string) {
    return useQuery({
        queryKey: ['negotiations', applicationId],
        queryFn: () => negotiationService.getHistory(applicationId),
        enabled: !!applicationId,
    })
}

// /**
//  * Propose or counter-propose lease terms
//  */
// export function useProposeTerms() {
//     const queryClient = useQueryClient()
//
//     return useMutation({
//         mutationFn: (data: ProposeTermsRequest) => negotiationService.propose(data),
//         onSuccess: (_, variables) => {
//             queryClient.invalidateQueries({ queryKey: ['negotiations', variables.applicationId] })
//             queryClient.invalidateQueries({ queryKey: ['applications', variables.applicationId] })
//         },
//     })
// }

/**
 * Accept proposed terms
 */
export function useAcceptTerms() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ applicationId, negotiationId }: { applicationId: string; negotiationId: string }) =>
            negotiationService.accept(applicationId, negotiationId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['negotiations', variables.applicationId] })
            queryClient.invalidateQueries({ queryKey: ['applications', variables.applicationId] })
        },
    })
}

/**
 * Reject proposed terms
 */
export function useRejectTerms() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ applicationId, negotiationId, message }: {
            applicationId: string
            negotiationId: string
            message: string
        }) => negotiationService.reject(applicationId, negotiationId, message),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['negotiations', variables.applicationId] })
            queryClient.invalidateQueries({ queryKey: ['applications', variables.applicationId] })
        },
    })
}
