
import { useQuery } from '@tanstack/react-query'
import { apiClient as api } from '@/core/api/client'

export const crmService = {
    getStats: async () => {
        const { data } = await api.get('/users/crm-stats')
        return data
    },
    getCustomers: async (filters?: any) => {
        const { data } = await api.get('/users', { params: filters })
        return data
    }
}

export function useCrmStats() {
    return useQuery({
        queryKey: ['crm-stats'],
        queryFn: () => crmService.getStats(),
    })
}

export function useCustomers(filters?: any) {
    return useQuery({
        queryKey: ['customers', filters],
        queryFn: () => crmService.getCustomers(filters),
    })
}
