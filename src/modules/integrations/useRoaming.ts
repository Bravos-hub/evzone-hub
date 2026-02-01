
import { useQuery } from '@tanstack/react-query'
import { roamingService } from './roamingService'

export function useRoamingSessions(filters?: any) {
    return useQuery({
        queryKey: ['roaming-sessions', filters],
        queryFn: () => roamingService.getSessions(filters),
    })
}

export function useRoamingCdrs(filters?: any) {
    return useQuery({
        queryKey: ['roaming-cdrs', filters],
        queryFn: () => roamingService.getCdrs(filters),
    })
}
