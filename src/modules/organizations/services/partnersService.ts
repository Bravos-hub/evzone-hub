
import { apiClient as api } from '@/core/api/client'

export interface Partner {
    id: string
    name: string
    role: 'CPO' | 'EMSP'
    status: 'Connected' | 'Pending' | 'Error'
    modules: ('Locations' | 'Sessions' | 'CDRs' | 'Tariffs')[]
    version: string
    endpoint?: string
    lastSync?: string
}

export const partnersService = {
    getAll: async (): Promise<Partner[]> => {
        const { data } = await api.get('/ocpi/partners')
        return data || []
    }
}
