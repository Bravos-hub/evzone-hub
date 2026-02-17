import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/core/auth/authStore'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { resolveUserOrgId } from '@/modules/auth/services/userService'
import { useStations } from '@/modules/stations/hooks/useStations'
import { sessionService } from '@/modules/sessions/services/sessionService'
import type { ChargingSession, User } from '@/core/api/types'
import type { OwnerCapability } from '@/core/auth/types'
import {
  buildOwnerReportMetrics,
  emptyOwnerReportMetrics,
  type OwnerReportMetrics,
  type OwnerReportRange
} from '../utils/ownerReportMetrics'

const PAGE_SIZE = 200
const MAX_PAGES = 30

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
}

function thresholdForRange(range: OwnerReportRange, now: Date): Date | null {
  if (range === 'ALL') return null
  if (range === 'YTD') {
    return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
  }
  const days = range === '30d' ? 30 : range === '90d' ? 90 : 7
  return startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)))
}

function parseDate(value?: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function getSessionsForRange(range: OwnerReportRange): Promise<ChargingSession[]> {
  const now = new Date()
  const threshold = thresholdForRange(range, now)
  const allSessions: ChargingSession[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await sessionService.getHistory({ page, limit: PAGE_SIZE })
    const pageSessions = Array.isArray(response?.sessions) ? response.sessions : []

    if (pageSessions.length === 0) break
    allSessions.push(...pageSessions)

    const totalPages = response?.pagination?.totalPages ?? page
    if (page >= totalPages) break

    if (threshold) {
      const newestInPage = pageSessions.reduce<Date | null>((latest, session) => {
        const startedAt = parseDate(session.startedAt)
        if (!startedAt) return latest
        if (!latest || startedAt.getTime() > latest.getTime()) return startedAt
        return latest
      }, null)

      if (newestInPage && newestInPage.getTime() < threshold.getTime()) {
        break
      }
    }
  }

  return Array.from(new Map(allSessions.map((session) => [session.id, session])).values())
}

function resolveCapability(me?: User, fallback?: { ownerCapability?: OwnerCapability }): OwnerCapability | undefined {
  return me?.ownerCapability ?? fallback?.ownerCapability
}

export function useOwnerAdvancedReporting(dateRange: OwnerReportRange): {
  metrics: OwnerReportMetrics
  isLoading: boolean
  error: unknown
  refetch: () => void
} {
  const { data: me, isLoading: meLoading } = useMe()
  const authUser = useAuthStore((state) => state.user)

  const viewerId = me?.id ?? authUser?.id
  const viewerRole = me?.role ?? authUser?.role
  const viewerOrgId = resolveUserOrgId(me) ?? authUser?.orgId ?? authUser?.organizationId
  const ownerCapability = resolveCapability(me, authUser ?? undefined)

  const stationsQuery = useStations(
    viewerOrgId ? { orgId: viewerOrgId } : undefined,
    { enabled: !!viewerId }
  )

  const sessionsQuery = useQuery({
    queryKey: [
      'analytics',
      'owner-advanced-reporting',
      {
        dateRange,
        viewerId: viewerId ?? 'unknown',
        viewerRole: viewerRole ?? 'unknown',
        scopeOrgId: viewerOrgId ?? 'unknown',
        capability: ownerCapability ?? 'unknown',
      },
    ],
    queryFn: () => getSessionsForRange(dateRange),
    enabled: !!viewerId,
    staleTime: 60_000,
  })

  const metrics = useMemo(() => {
    const sessions = sessionsQuery.data ?? []
    if (sessions.length === 0 && !(stationsQuery.data && stationsQuery.data.length > 0)) {
      return emptyOwnerReportMetrics(dateRange)
    }

    return buildOwnerReportMetrics({
      sessions,
      stations: stationsQuery.data ?? [],
      range: dateRange,
      capability: ownerCapability,
    })
  }, [dateRange, ownerCapability, sessionsQuery.data, stationsQuery.data])

  return {
    metrics,
    isLoading: meLoading || sessionsQuery.isLoading || (stationsQuery.isLoading && (sessionsQuery.data?.length ?? 0) === 0),
    error: sessionsQuery.error,
    refetch: () => {
      void sessionsQuery.refetch()
    },
  }
}
