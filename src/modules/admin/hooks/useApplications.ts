import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/core/api/client'

export interface UserApplication {
    id: string
    userId: string
    user: {
        id: string
        name: string
        email: string
        phone?: string
        createdAt: string
    }
    companyName?: string
    taxId?: string
    country: string
    region: string
    accountType: string
    role: string
    subscribedPackage?: string
    documents: Array<{
        type: string
        url: string
        name?: string
    }>
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    reviewedBy?: string
    reviewer?: {
        id: string
        name: string
        email: string
    }
    reviewedAt?: string
    rejectionReason?: string
    adminNotes?: string
    submittedAt: string
    createdAt: string
    updatedAt: string
}

// Get pending applications
export function usePendingApplications() {
    return useQuery<UserApplication[]>({
        queryKey: ['admin', 'applications', 'pending'],
        queryFn: async () => {
            const data = await apiClient.get<UserApplication[]>('/admin/applications/pending')
            return data
        },
    })
}

// Get application details
export function useApplicationDetails(id: string) {
    return useQuery<UserApplication>({
        queryKey: ['admin', 'applications', id],
        queryFn: async () => {
            const data = await apiClient.get<UserApplication>(`/admin/applications/${id}`)
            return data
        },
        enabled: !!id,
    })
}

// Approve application
export function useApproveApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
            const response = await apiClient.post(`/admin/applications/${id}/approve`, { notes })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] })
        },
    })
}

// Reject application
export function useRejectApplication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, reason, notes }: { id: string; reason: string; notes?: string }) => {
            const response = await apiClient.post(`/admin/applications/${id}/reject`, { reason, notes })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] })
        },
    })
}
