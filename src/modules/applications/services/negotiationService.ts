/**
 * Negotiation Service
 * Handles lease term negotiations
 */

import { apiClient } from '@/core/api/client'
import type {
    NegotiationRound,
    ProposeTermsRequest,
    RespondToTermsRequest,
    Application,
} from '../types'

export const negotiationService = {
    /**
     * Get negotiation history for an application
     */
    async getHistory(applicationId: string): Promise<NegotiationRound[]> {
        return apiClient.get<NegotiationRound[]>(`/applications/${applicationId}/negotiations`)
    },

    /**
     * Propose or counter-propose terms
     */
    async propose(data: ProposeTermsRequest): Promise<NegotiationRound> {
        const { applicationId, terms, message } = data
        return apiClient.post<NegotiationRound>(`/applications/${applicationId}/negotiations`, {
            terms,
            message,
        })
    },

    /**
     * Accept proposed terms
     */
    async accept(applicationId: string, negotiationId: string): Promise<Application> {
        return apiClient.patch<Application>(
            `/applications/${applicationId}/negotiations/${negotiationId}/accept`
        )
    },

    /**
     * Reject proposed terms
     */
    async reject(applicationId: string, negotiationId: string, message: string): Promise<NegotiationRound> {
        return apiClient.patch<NegotiationRound>(
            `/applications/${applicationId}/negotiations/${negotiationId}/reject`,
            { message }
        )
    },
}
