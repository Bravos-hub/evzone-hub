import { useMemo } from 'react'
import { useScopeStore } from '@/core/scope/scopeStore'
import { useOwnerDashboard } from './useAnalytics'

function normalize(value?: string | 'ALL') {
  return !value || value === 'ALL' ? undefined : value
}

function toOwnerRange(value: string): '7d' | '30d' | '90d' | 'YTD' | 'ALL' {
  if (value === '7D' || value === 'TODAY') return '7d'
  if (value === '30D') return '30d'
  if (value === '90D') return '90d'
  if (value === 'YTD') return 'YTD'
  if (value === 'ALL') return 'ALL'
  return '7d'
}

export function useOwnerDashboardData() {
  const { scope } = useScopeStore()

  const filters = useMemo(
    () => ({
      range: toOwnerRange(scope.dateRange),
      siteId: normalize(scope.siteId),
      stationId: normalize(scope.stationId),
      chargerType: normalize(scope.chargerType),
      sessionStatus: normalize(scope.sessionStatus),
      state: normalize(scope.state),
      compare: 'previous' as const,
    }),
    [scope.chargerType, scope.dateRange, scope.sessionStatus, scope.siteId, scope.state, scope.stationId],
  )

  const query = useOwnerDashboard(filters)

  return {
    ...query,
    filters,
  }
}
