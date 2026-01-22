/**
 * Tenant Module Types
 */

import { Station, LeaseContract } from '@/core/api/types'

export interface TenantKPI {
    totalStations: number
    activeStations: number
    totalRevenue: number
    uptime: number
    activeLeases: number
    pendingApplications: number
}

// For the Delegated Operational Model
export interface OperatorPerformance {
    operatorId: string
    operatorName: string
    uptime: number
    slaCompliance: number // Percentage
    ticketsRaised: number
    ticketsResolved: number
    averageResponseTime: number // hours
    rating: number // 1-5
}

export interface TenantSiteSummary {
    siteId: string
    siteName: string
    address: string
    status: 'Active' | 'Pending' | 'Maintenance'
    leaseId: string
    leaseStatus: LeaseContract['status']
    stations: Station[]

    // Operational Model
    isDelegated: boolean
    operatorId?: string
    operatorName?: string

    // Stats
    revenue: number
    energy: number
    sessions: number
    uptime: number
}

// For Site Owner View
export interface TenantHealth {
    tenantId: string
    complianceScore: number // 0-100
    paymentStatus: 'Good' | 'Fair' | 'Poor' | 'Critical'
    leaseCompliant: boolean
    lastAuditDate?: string
    issues: string[]
}
