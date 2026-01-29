/**
 * Lease Service
 * Handles lease document generation and signing
 */

import { apiClient } from '@/core/api/client'
import { API_CONFIG } from '@/core/api/config'
import type {
    LeaseDocument,
    GenerateLeaseRequest,
    UploadSignedLeaseRequest,
    VerifyLeaseRequest,
    Application,
} from '../types'

export const leaseService = {
    /**
     * Generate lease PDF from application
     */
    async generate(data: GenerateLeaseRequest): Promise<{ leaseUrl: string }> {
        const { applicationId } = data
        return apiClient.post(`/applications/${applicationId}/lease/generate`)
    },

    /**
     * Download lease PDF
     */
    async download(applicationId: string): Promise<Blob> {
        const response = await fetch(`${API_CONFIG.baseURL}/applications/${applicationId}/lease`, {
            credentials: 'include',
        })
        if (!response.ok) {
            throw new Error(`Failed to download lease: ${response.statusText}`)
        }
        return response.blob()
    },

    /**
     * Upload signed lease document
     */
    async uploadSigned(data: UploadSignedLeaseRequest): Promise<{ leaseUrl: string }> {
        const { applicationId, file, signedBy } = data
        const formData = new FormData()
        formData.append('file', file)
        formData.append('signedBy', signedBy)

        return apiClient.post(`/applications/${applicationId}/lease/upload`, formData)
    },

    /**
     * Admin: Verify signed lease
     */
    async verify(data: VerifyLeaseRequest): Promise<Application> {
        const { applicationId, approved, notes } = data
        return apiClient.patch(`/applications/${applicationId}/lease/verify`, { approved, notes })
    },
}
