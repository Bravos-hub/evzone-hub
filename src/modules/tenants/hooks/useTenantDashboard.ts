import { useLeases } from '@/modules/applications/hooks/useApplications'
import type { ApplicationStatus } from '@/modules/applications/types'
import { useStations } from '@/modules/stations/hooks/useStations'
import { useSites } from '@/modules/sites/hooks/useSites'
import { useUsers } from '@/modules/auth/hooks/useUsers'
import { useAuthStore } from '@/core/auth/authStore'
import type { LeaseContract, User } from '@/core/api/types'
import type { TenantKPI, TenantSiteSummary } from '../types/tenant'

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

    const activeLeasesCount = leases.filter(lease => ACTIVE_LEASE_STATUSES.includes(lease.status)).length
    const pendingLeasesCount = leases.filter(lease => PENDING_LEASE_STATUSES.includes(lease.status)).length

    const stats: TenantKPI = {
        totalStations: myStations.length,
        activeStations: myStations.filter(s => s.status === 'ACTIVE').length,
        totalRevenue: myStations.length * 1250,
        uptime: myStations.length > 0 ? 98.5 : 0,
        activeLeases: activeLeasesCount,
        pendingApplications: pendingLeasesCount
    }

    return {
        data: stats,
        isLoading: isLoadingLeases || isLoadingStations
    }
}

export function useTenantSites() {
    const { user } = useAuthStore()
    const { data: leases = [] } = useLeases()
    const { data: allStations = [] } = useStations()
    const { data: sites = [] } = useSites()

    if (!user) {
        return { data: [], isLoading: false }
    }

    const leaseBySite = new Map<string, typeof leases[number]>()
    leases.forEach(lease => {
        if (lease.siteId) {
            leaseBySite.set(lease.siteId, lease)
        }
    })

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
        const revenue = siteStations.length * 1250
        const energy = siteStations.length * 450

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
            sessions: siteStations.length * 15,
            uptime,
        }
    })

    return {
        data: tenantSites,
        isLoading: false
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
