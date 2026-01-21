/**
 * Tariff Service
 * Handles tariff-related API calls
 */

import { apiClient } from '../client'
import type { Tariff } from '@/core/types/domain'

export interface CreateTariffRequest {
  name: string
  description?: string
  type: 'Time-based' | 'Energy-based' | 'Fixed' | 'Dynamic'
  paymentModel: 'Prepaid' | 'Postpaid'
  currency: string
  elements: Array<{
    pricePerKwh?: number
    pricePerMinute?: number
    pricePerSession?: number
    period?: 'Peak' | 'Off-Peak' | 'Standard'
    startTime?: string
    endTime?: string
    days?: number[]
    stepSize?: number
    minDuration?: number
    maxDuration?: number
  }>
  validFrom?: string
  validTo?: string
  applicableStations?: string[]
}

export interface UpdateTariffRequest {
  name?: string
  description?: string
  type?: 'Time-based' | 'Energy-based' | 'Fixed' | 'Dynamic'
  paymentModel?: 'Prepaid' | 'Postpaid'
  currency?: string
  active?: boolean
  elements?: Array<{
    pricePerKwh?: number
    pricePerMinute?: number
    pricePerSession?: number
    period?: 'Peak' | 'Off-Peak' | 'Standard'
    startTime?: string
    endTime?: string
    days?: number[]
    stepSize?: number
    minDuration?: number
    maxDuration?: number
  }>
  validFrom?: string
  validTo?: string
  applicableStations?: string[]
}

export const tariffService = {
  /**
   * Get all tariffs
   */
  async getAll(query?: { active?: boolean }): Promise<Tariff[]> {
    const params = new URLSearchParams()
    if (query?.active !== undefined) params.append('active', query.active.toString())

    const queryString = params.toString()
    return apiClient.get<Tariff[]>(`/tariffs${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get tariff by ID
   */
  async getById(id: string): Promise<Tariff> {
    return apiClient.get<Tariff>(`/tariffs/${id}`)
  },

  /**
   * Create tariff
   */
  async create(data: CreateTariffRequest): Promise<Tariff> {
    return apiClient.post<Tariff>('/tariffs', data)
  },

  /**
   * Update tariff
   */
  async update(id: string, data: UpdateTariffRequest): Promise<Tariff> {
    return apiClient.patch<Tariff>(`/tariffs/${id}`, data)
  },

  /**
   * Delete tariff
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/tariffs/${id}`)
  },
}
