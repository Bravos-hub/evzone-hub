import { useMemo } from 'react'
import { useScopeStore } from '@/core/scope/scopeStore'
import { useOwnerDashboard } from './useAnalytics'

function normalize(value?: string | 'ALL') {
  return !value || value === 'ALL' ? undefined : value
}

function toOwnerRange(value: string) {
  if (value === 'TODAY') return '7d' as const
  if (value === '30D') return '30d' as const
  return '7d' as const
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
