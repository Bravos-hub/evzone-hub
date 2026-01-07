/**
 * Session Hooks
 * React Query hooks for charging session management
 */

import { useQuery } from '@tanstack/react-query'
import { sessionService } from '../services/sessionService'
import { queryKeys } from '@/data/queryKeys'

export function useActiveSessions() {
  return useQuery({
    queryKey: queryKeys.sessions.active,
    queryFn: () => sessionService.getActive(),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => sessionService.getById(id),
    enabled: !!id,
  })
}

export function useSessionStats() {
  return useQuery({
    queryKey: queryKeys.sessions.stats,
    queryFn: () => sessionService.getStats(),
  })
}

export function useStationSessions(stationId: string, activeOnly?: boolean) {
  return useQuery({
    queryKey: queryKeys.sessions.byStation(stationId, activeOnly),
    queryFn: () => sessionService.getByStation(stationId, activeOnly),
    enabled: !!stationId,
    refetchInterval: activeOnly ? 30000 : undefined, // Refetch active sessions every 30 seconds
  })
}

export function useUserSessions(userId: string, activeOnly?: boolean) {
  return useQuery({
    queryKey: queryKeys.sessions.byUser(userId, activeOnly),
    queryFn: () => sessionService.getByUser(userId, activeOnly),
    enabled: !!userId,
  })
}

export function useSessionHistory(filters?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.sessions.history(filters),
    queryFn: () => sessionService.getHistory(filters),
  })
}

