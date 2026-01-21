/**
 * Booking Service
 * Handles booking-related API calls
 */

import { apiClient } from '../client'
import type { Booking, CreateBookingRequest, UpdateBookingStatusRequest } from '../types'

export const bookingService = {
  /**
   * Get all bookings for current user
   */
  async getAll(): Promise<Booking[]> {
    return apiClient.get<Booking[]>('/bookings')
  },

  /**
   * Get booking by ID
   */
  async getById(id: string): Promise<Booking> {
    return apiClient.get<Booking>(`/bookings/${id}`)
  },

  /**
   * Create booking
   */
  async create(data: CreateBookingRequest): Promise<Booking> {
    return apiClient.post<Booking>('/bookings', data)
  },

  /**
   * Update booking
   */
  async update(id: string, data: Partial<CreateBookingRequest>): Promise<Booking> {
    return apiClient.patch<Booking>(`/bookings/${id}`, data)
  },

  /**
   * Delete/Cancel booking
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/bookings/${id}`)
  },

  /**
   * Get booking queue
   */
  async getQueue(stationId: string): Promise<Booking[]> {
    return apiClient.get<Booking[]>(`/bookings/queue?stationId=${stationId}`)
  },

  /**
   * Check in to booking
   */
  async checkIn(id: string): Promise<Booking> {
    return apiClient.post<Booking>(`/bookings/${id}/checkin`)
  },

  /**
   * Update booking status
   */
  async updateStatus(id: string, status: UpdateBookingStatusRequest['status']): Promise<Booking> {
    return apiClient.patch<Booking>(`/bookings/${id}/status`, { status })
  },

  /**
   * Extend booking
   */
  async extend(id: string, minutes: number): Promise<Booking> {
    return apiClient.patch<Booking>(`/bookings/${id}/extend`, { minutes })
  },

  /**
   * Cancel booking
   */
  async cancel(id: string): Promise<Booking> {
    return apiClient.patch<Booking>(`/bookings/${id}/cancel`)
  },

  /**
   * Get bookings by user ID
   */
  async getByUserId(userId: string): Promise<Booking[]> {
    return apiClient.get<Booking[]>(`/bookings/user/${userId}`)
  },

  /**
   * Get bookings by station ID
   */
  async getByStationId(stationId: string): Promise<Booking[]> {
    return apiClient.get<Booking[]>(`/bookings/station/${stationId}`)
  },
}

