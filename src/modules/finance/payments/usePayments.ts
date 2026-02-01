
import { useQuery } from '@tanstack/react-query'
import { apiClient as api } from '@/core/api/client'

export const financeService = {
    getPayments: async (filters?: any) => {
        const { data } = await api.get('/finance/payments', { params: filters })
        return data
    },
    // Add other methods if needed
}

export function usePayments(filters?: any) {
    return useQuery({
        queryKey: ['payments', filters],
        queryFn: () => financeService.getPayments(filters),
    })
}
