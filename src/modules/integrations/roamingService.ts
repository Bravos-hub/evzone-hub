
import { apiClient as api } from '@/core/api/client'

export interface RoamingSession {
    id: string
    role: 'CPO' | 'MSP'
    partner: string
    site: string
    cp: string
    start: string
    end: string
    dur: string
    kwh: number
    cur: string
    amt: number
    status: 'Completed' | 'Charging' | 'Failed' | 'Refunded'
}

export interface RoamingCDR {
    cdr: string
    session: string
    role: 'CPO' | 'MSP'
    partner: string
    site: string
    start: string
    end: string
    dur: string
    kwh: number
    cur: string
    amt: number
    tariff: string
    fee: number
    net: number
    status: 'Finalized' | 'Sent' | 'Disputed' | 'Voided' | 'Pending'
}

export const roamingService = {
    getSessions: async (filters?: any): Promise<RoamingSession[]> => {
        const { data } = await api.get('/ocpi/actions/roaming-sessions')
        return data || []
    },

    getCdrs: async (filters?: any): Promise<RoamingCDR[]> => {
        const { data } = await api.get('/ocpi/actions/roaming-cdrs')
        return data || []
    }
}
