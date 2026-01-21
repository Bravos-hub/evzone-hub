/**
 * Lease Negotiation Types
 */

import type { LeaseTerms } from './application'

export interface NegotiationRound {
    id: string
    applicationId: string
    proposedBy: string
    proposer?: any // User type
    terms: LeaseTerms
    status: NegotiationStatus
    respondedBy?: string
    respondedAt?: string
    message?: string
    createdAt: string
}

export type NegotiationStatus =
    | 'PROPOSED'
    | 'COUNTERED'
    | 'ACCEPTED'
    | 'REJECTED'

export interface ProposeTermsRequest {
    applicationId: string
    terms: LeaseTerms
    message?: string
}

export interface RespondToTermsRequest {
    applicationId: string
    negotiationId: string
    action: 'ACCEPT' | 'REJECT' | 'COUNTER'
    message?: string
    counterTerms?: LeaseTerms
}
