/**
 * Analytics Hooks
 * React Query hooks for analytics
 */

import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import { queryKeys } from '@/data/queryKeys'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard,
    queryFn: () => analyticsService.getDashboard(),
    refetchInterval: 60000, // Refetch every minute for real-time updates
  })
}

export function useUptime(period: '24h' | '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: queryKeys.analytics.uptime(period),
    queryFn: () => analyticsService.getUptime(period),
  })
}

export function useUsage(period: '24h' | '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: queryKeys.analytics.usage(period),
    queryFn: () => analyticsService.getUsage(period),
  })
}

export function useRevenue(period: '24h' | '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: queryKeys.analytics.revenue(period),
    queryFn: () => analyticsService.getRevenue(period),
  })
}

export function useEnergy(period: '24h' | '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: queryKeys.analytics.energy(period),
    queryFn: () => analyticsService.getEnergy(period),
  })
}

export function useRealtimeStats() {
  return useQuery({
    queryKey: queryKeys.analytics.realtime,
    queryFn: () => analyticsService.getRealtime(),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  })
}

export function useOperatorDashboard(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.operatorDashboard(startDate, endDate),
    queryFn: () => analyticsService.getOperatorDashboard(startDate, endDate),
  })
}

export function useResellerDashboard(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.resellerDashboard(startDate, endDate),
    queryFn: () => analyticsService.getResellerDashboard(startDate, endDate),
  })
}

