/**
 * Application & Lease Management Types
 */

import type { Site } from '@/core/api/types'

export interface Application {
    id: string
    siteId: string
    site?: Site
    operatorId: string
    operator?: any // User type
    status: ApplicationStatus
    submittedAt: string

    // Approval
    reviewedBy?: string
    reviewedAt?: string
    approvalNotes?: string

    // Negotiation
    proposedTerms?: LeaseTerms
    negotiatedTerms?: LeaseTerms
    termsAgreedAt?: string

    // Payment
    securityDepositAmount?: number
    depositPaidAt?: string
    depositReceiptUrl?: string
    paymentId?: string

    // Lease
    leaseAgreementUrl?: string
    leaseSignedAt?: string
    leaseStartDate?: string
    leaseEndDate?: string

    completedAt?: string
    tenantId?: string

    // Derived/Display Fields (populated by backend or mapper)
    siteName?: string
    createdAt?: string // Alias for submittedAt
    preferredLeaseModel?: string
    numberOfChargingPoints?: number
    responseMessage?: string
    proposedRent?: number
    proposedTerm?: number
}

export type ApplicationStatus =
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'INFO_REQUESTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'NEGOTIATING'
    | 'TERMS_AGREED'
    | 'AWAITING_DEPOSIT'
    | 'DEPOSIT_PAID'
    | 'LEASE_DRAFTING'
    | 'LEASE_PENDING_SIGNATURE'
    | 'LEASE_SIGNED'
    | 'COMPLIANCE_CHECK'
    | 'COMPLETED'
    | 'WITHDRAWN'
    | 'CANCELLED'
    | 'EXPIRED'

export interface LeaseTerms {
    monthlyRent: number
    currency: string
    leaseDuration: number // months
    securityDepositMonths: number
    revenueSharePercent?: number
    maintenanceResponsibility: 'OWNER' | 'OPERATOR' | 'SHARED'
    utilitiesResponsibility: 'OWNER' | 'OPERATOR'
    noticePeriodDays: number
    renewalOption: boolean
    customClauses?: string[]
}

export interface CreateApplicationRequest {
    siteId: string
    proposedTerms?: LeaseTerms
    message?: string
}

export interface UpdateApplicationStatusRequest {
    status: ApplicationStatus
    message?: string
}

export interface ApplicationListFilters {
    status?: ApplicationStatus
    siteId?: string
}
