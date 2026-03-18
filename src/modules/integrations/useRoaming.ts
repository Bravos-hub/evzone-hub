import { useQuery } from '@tanstack/react-query'
import { RoamingFilters, roamingService } from './roamingService'

export function useRoamingSessions(filters?: RoamingFilters) {
  return useQuery({
    queryKey: ['roaming-sessions', filters],
    queryFn: () => roamingService.getSessions(filters),
  })
}

export function useRoamingSessionDetail(id?: string) {
  return useQuery({
    queryKey: ['roaming-session-detail', id],
    queryFn: () => roamingService.getSessionById(id || ''),
    enabled: Boolean(id),
  })
}

export function useRoamingCdrs(filters?: RoamingFilters) {
  return useQuery({
    queryKey: ['roaming-cdrs', filters],
    queryFn: () => roamingService.getCdrs(filters),
  })
}

export function useRoamingCdrDetail(id?: string) {
  return useQuery({
    queryKey: ['roaming-cdr-detail', id],
    queryFn: () => roamingService.getCdrById(id || ''),
    enabled: Boolean(id),
  })
}
