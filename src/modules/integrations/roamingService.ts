import { apiClient as api } from '@/core/api/client'

export interface RoamingSession {
  id: string
  role: 'CPO' | 'MSP'
  partner: string
  site: string
  cp: string
  start: string
  end: string | null
  dur: string
  kwh: number
  cur: string
  amt: number
  status: 'Completed' | 'Charging' | 'Failed' | 'Refunded'
  raw?: Record<string, unknown>
}

export interface RoamingCDR {
  cdr: string
  session: string
  role: 'CPO' | 'MSP'
  partner: string
  site: string
  start: string
  end: string | null
  dur: string
  kwh: number
  cur: string
  amt: number
  tariff: string
  fee: number
  net: number
  status: 'Finalized' | 'Sent' | 'Disputed' | 'Voided' | 'Pending'
  raw?: Record<string, unknown>
}

export interface RoamingFilters {
  q?: string
  role?: string
  partner?: string
  status?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export interface RoamingListResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const roamingService = {
  getSessions: async (filters?: RoamingFilters): Promise<RoamingListResponse<RoamingSession>> => {
    return api.get<RoamingListResponse<RoamingSession>>('/ocpi/actions/roaming-sessions', {
      params: filters,
    })
  },

  getSessionById: async (id: string): Promise<Record<string, unknown> | null> => {
    return api.get<Record<string, unknown> | null>(`/ocpi/actions/roaming-sessions/${id}`)
  },

  getCdrs: async (filters?: RoamingFilters): Promise<RoamingListResponse<RoamingCDR>> => {
    return api.get<RoamingListResponse<RoamingCDR>>('/ocpi/actions/roaming-cdrs', {
      params: filters,
    })
  },

  getCdrById: async (id: string): Promise<Record<string, unknown> | null> => {
    return api.get<Record<string, unknown> | null>(`/ocpi/actions/roaming-cdrs/${id}`)
  },
}
