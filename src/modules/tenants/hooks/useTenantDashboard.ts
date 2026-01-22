import { useMemo } from 'react'
import { useLeases } from '@/modules/applications/hooks/useApplications'
import type { ApplicationStatus } from '@/modules/applications/types'
import { useStations } from '@/modules/stations/hooks/useStations'
import { useSites } from '@/modules/sites/hooks/useSites'
import { useUsers } from '@/modules/auth/hooks/useUsers'
import { useAuthStore } from '@/core/auth/authStore'
import type { LeaseContract, Station, StationStats, User } from '@/core/api/types'
import type { TenantKPI, TenantSiteSummary } from '../types/tenant'
import { useQuery } from '@tanstack/react-query'
import { stationService } from '@/modules/stations/services/stationService'

const ACTIVE_LEASE_STATUSES: ApplicationStatus[] = ['LEASE_SIGNED', 'COMPLETED']
const PENDING_LEASE_STATUSES: ApplicationStatus[] = [
    'PENDING_REVIEW',
    'APPROVED',
    'NEGOTIATING',
    'TERMS_AGREED',
    'LEASE_DRAFTING',
    'LEASE_PENDING_SIGNATURE',
    'AWAITING_DEPOSIT',
    'DEPOSIT_PAID',
]
const TERMINATED_LEASE_STATUSES: ApplicationStatus[] = ['REJECTED', 'WITHDRAWN', 'CANCELLED', 'EXPIRED']

export function useStationOwnerStats() {
    const { user } = useAuthStore()

    // 1. Get my leases (Applications in current mock)
    const { data: leases = [], isLoading: isLoadingLeases } = useLeases()

    // 2. Get stations where I am the Owner
    const { data: allStations = [], isLoading: isLoadingStations } = useStations()
    const myStations = allStations.filter(s => s.ownerId === user?.id)
    const { data: statsByStation = {}, isLoading: isLoadingStats } = useStationStatsMap(myStations)

    const activeLeasesCount = leases.filter(lease => ACTIVE_LEASE_STATUSES.includes(lease.status)).length
    const pendingLeasesCount = leases.filter(lease => PENDING_LEASE_STATUSES.includes(lease.status)).length

    const stats: TenantKPI = {
        totalStations: myStations.length,
        activeStations: myStations.filter(s => s.status === 'ACTIVE').length,
        totalRevenue: sumStationStats(statsByStation, 'totalRevenue'),
        uptime: myStations.length > 0 ? Math.round((myStations.filter(s => s.status === 'ACTIVE').length / myStations.length) * 1000) / 10 : 0,
        activeLeases: activeLeasesCount,
        pendingApplications: pendingLeasesCount
    }

    return {
        data: stats,
        isLoading: isLoadingLeases || isLoadingStations || isLoadingStats
    }
}

export function useTenantSites() {
    const { user } = useAuthStore()
    const { data: leases = [], isLoading: isLoadingLeases } = useLeases()
    const { data: allStations = [], isLoading: isLoadingStations } = useStations()
    const { data: sites = [], isLoading: isLoadingSites } = useSites()
    const { data: statsByStation = {}, isLoading: isLoadingStats } = useStationStatsMap(allStations)

    if (!user) {
        return { data: [], isLoading: false }
    }

    const leaseBySite = new Map<string, typeof leases[number]>()
    leases.forEach(lease => {
        if (lease.siteId) {
            leaseBySite.set(lease.siteId, lease)
        }
    })

    const ownedStationIds = new Set(allStations.map(station => station.id))
    const ownedStations = allStations.filter(station => station.ownerId === user.id)
    const stationSiteIds = ownedStations
        .map(station => station.orgId)
        .filter((siteId): siteId is string => Boolean(siteId))

    const siteIds = Array.from(new Set([...leaseBySite.keys(), ...stationSiteIds]))

    const tenantSites: TenantSiteSummary[] = siteIds.map(siteId => {
        const lease = leaseBySite.get(siteId)
        const site = sites.find(candidate => candidate.id === siteId)

        const leaseStationIds = (lease as { stationIds?: string[] } | undefined)?.stationIds ?? []
        const siteStations = leaseStationIds.length
            ? allStations.filter(station => leaseStationIds.includes(station.id))
            : allStations.filter(station => station.orgId === siteId || station.ownerId === user.id)
        const siteStationIds = siteStations.map(station => station.id)
        const statsForSite = siteStationIds
            .filter(id => ownedStationIds.has(id))
            .map(id => statsByStation[id])
            .filter(Boolean)

        const delegatedStation = siteStations.find(
            station => station.operatorId && station.operatorId !== station.ownerId
        )
        const operatorId = delegatedStation?.operatorId
        const isDelegated = Boolean(operatorId)

        let leaseStatus: LeaseContract['status'] = 'Active'
        if (lease?.status && TERMINATED_LEASE_STATUSES.includes(lease.status)) {
            leaseStatus = 'Terminated'
        } else if (lease?.status && !ACTIVE_LEASE_STATUSES.includes(lease.status)) {
            leaseStatus = 'Expiring'
        }

        const hasMaintenance = siteStations.some(station => station.status === 'MAINTENANCE')
        let siteStatus: 'Active' | 'Pending' | 'Maintenance' = 'Active'
        if (hasMaintenance) {
            siteStatus = 'Maintenance'
        }
        if (!siteStations.length || (lease?.status && PENDING_LEASE_STATUSES.includes(lease.status))) {
            siteStatus = 'Pending'
        }

        const activeStations = siteStations.filter(station => station.status === 'ACTIVE').length
        const uptime = siteStations.length > 0 ? Math.round((activeStations / siteStations.length) * 1000) / 10 : 0
        const revenue = statsForSite.reduce((sum, stats) => sum + stats.totalRevenue, 0)
        const energy = statsForSite.reduce((sum, stats) => sum + stats.totalEnergy, 0)
        const sessions = statsForSite.reduce((sum, stats) => sum + stats.totalSessions, 0)

        return {
            siteId,
            siteName: site?.name || 'Unknown Site',
            address: site?.address || 'Unknown Address',
            status: siteStatus,
            leaseId: lease?.id || siteId,
            leaseStatus,
            stations: siteStations,
            isDelegated,
            operatorId,
            operatorName: undefined,
            revenue,
            energy,
            sessions,
            uptime,
        }
    })

    return {
        data: tenantSites,
        isLoading: isLoadingLeases || isLoadingStations || isLoadingSites || isLoadingStats
    }
}

export function useAssignedOperator(siteId?: string) {
    const { data: stations = [], isLoading: stationsLoading } = useStations()
    const { data: users = [], isLoading: usersLoading } = useUsers()

    const siteStations = siteId ? stations.filter(station => station.orgId === siteId) : []
    const delegatedStation = siteStations.find(
        station => station.operatorId && station.operatorId !== station.ownerId
    )
    const operatorId = delegatedStation?.operatorId
    const operator = users.find(user => user.id === operatorId)

    return {
        data: operator as User | undefined,
        operatorId,
        isLoading: stationsLoading || usersLoading,
    }
}

function useStationStatsMap(stations: Station[]) {
    const stationIds = useMemo(() => stations.map(station => station.id).sort(), [stations])

    return useQuery({
        queryKey: ['stations', 'stats-map', stationIds],
        queryFn: async () => {
            if (stationIds.length === 0) return {} as Record<string, StationStats>
            const entries = await Promise.all(
                stationIds.map(async id => [id, await stationService.getStats(id)] as const)
            )
            return Object.fromEntries(entries) as Record<string, StationStats>
        },
        enabled: stationIds.length > 0,
    })
}

function sumStationStats(statsByStation: Record<string, StationStats>, key: keyof StationStats) {
    return Object.values(statsByStation).reduce((sum, stats) => sum + (stats?.[key] ?? 0), 0)
}
