import { apiClient as api } from '@/core/api/client'

export interface Partner {
  id: string
  name: string
  partyId: string
  countryCode: string
  role: string
  status: 'Connected' | 'Pending' | 'Error'
  statusRaw?: string
  modules: string[]
  version: string
  endpoint?: string | null
  lastSync?: string | null
  lastSyncAt?: string | null
  capabilities?: {
    roles?: Record<string, unknown>[]
    endpoints?: Record<string, unknown>[]
  }
}

export interface PartnerQuery {
  q?: string
  status?: string
  role?: string
}

export interface CreatePartnerRequest {
  name: string
  partyId: string
  countryCode: string
  role: string
  versionsUrl?: string
}

export interface UpdatePartnerRequest {
  name?: string
  role?: string
  status?: string
  versionsUrl?: string
  roles?: Record<string, unknown>[]
  endpoints?: Record<string, unknown>[]
}

export const partnersService = {
  getAll: async (query?: PartnerQuery): Promise<Partner[]> => {
    return api.get<Partner[]>('/ocpi/partners', { params: query })
  },

  create: async (payload: CreatePartnerRequest) => {
    return api.post('/ocpi/partners', payload)
  },

  update: async (id: string, payload: UpdatePartnerRequest) => {
    return api.patch(`/ocpi/partners/${id}`, payload)
  },

  suspend: async (id: string) => {
    return api.post(`/ocpi/partners/${id}/suspend`, {})
  },

  sync: async (id: string) => {
    return api.post(`/ocpi/partners/${id}/sync`, {})
  },
}
