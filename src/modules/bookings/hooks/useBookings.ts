/**
 * Booking Hooks
 * React Query hooks for booking management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '../services/bookingService'
import { queryKeys } from '@/data/queryKeys'
import type { CreateBookingRequest } from '../types'

export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.all,
    queryFn: () => bookingService.getAll(),
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
  })
}

export function useBookingQueue(stationId: string) {
  return useQuery({
    queryKey: queryKeys.bookings.queue(stationId),
    queryFn: () => bookingService.getQueue(stationId),
    enabled: !!stationId,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBookingRequest) => bookingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
    },
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBookingRequest> }) =>
      bookingService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
    },
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' }) =>
      bookingService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
    },
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bookingService.checkIn(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
    },
  })
}

export function useExtendBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      bookingService.extend(id, minutes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
    },
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bookingService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
    },
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bookingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all })
    },
  })
}

