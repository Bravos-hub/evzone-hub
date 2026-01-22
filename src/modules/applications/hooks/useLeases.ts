/**
 * Lease Hooks
 * React Query hooks for lease document management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaseService } from '../services'
import type { GenerateLeaseRequest, UploadSignedLeaseRequest, VerifyLeaseRequest } from '../types'

// /**
//  * Generate lease PDF
//  */
// export function useGenerateLease() {
//     const queryClient = useQueryClient()
//
//     return useMutation({
//         mutationFn: (data: GenerateLeaseRequest) => leaseService.generate(data),
//         onSuccess: (_, variables) => {
//             queryClient.invalidateQueries({ queryKey: ['applications', variables.applicationId] })
//         },
//     })
// }

/**
 * Download lease PDF
 */
export function useDownloadLease() {
    return useMutation({
        mutationFn: async (applicationId: string) => {
            const blob = await leaseService.download(applicationId)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `lease-${applicationId}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        },
    })
}

/**
 * Upload signed lease
 */
export function useUploadSignedLease() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: UploadSignedLeaseRequest) => leaseService.uploadSigned(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['applications', variables.applicationId] })
        },
    })
}

/**
 * Admin: Verify signed lease
 */
export function useVerifyLease() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: VerifyLeaseRequest) => leaseService.verify(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['applications', variables.applicationId] })
        },
    })
}
