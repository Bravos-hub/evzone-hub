import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import type { DashboardMetrics } from '../types'

export function useDashboard() {
    return useQuery<DashboardMetrics>({
        queryKey: ['dashboard-metrics'],
        queryFn: () => analyticsService.getDashboard(),
        refetchInterval: 30000, // Refresh every 30s for 'real-time' feel
    })
}
