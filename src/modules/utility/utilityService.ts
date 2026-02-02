/**
 * Utility Service
 * Grid signals, forecasts, and utility dashboard data
 */

import { apiClient } from '@/core/api/client'

export interface UtilityKpi {
  label: string
  value: string | number
}

export interface UtilityGridEvent {
  id: string
  type: 'OpenADR' | 'Utility Notice' | 'Manual'
  level: 'HIGH' | 'MED' | 'LOW'
  start: string
  end: string
  status: 'Active' | 'Ended' | 'Scheduled'
}

export interface UtilitySiteRow {
  id: string
  name: string
  city: string
  headroom: number
  enrolled: boolean
  status: 'Open' | 'Throttled' | 'Offline'
}

export interface TariffMapping {
  utility: string
  plan: string
  bands: string
}

export interface UtilityDashboard {
  kpis: UtilityKpi[]
  events: UtilityGridEvent[]
  sites: UtilitySiteRow[]
  tariffMappings: TariffMapping[]
}

export const utilityService = {
  async getDashboard(): Promise<UtilityDashboard> {
    return apiClient.get<UtilityDashboard>('/utility/dashboard')
  },
}
