/**
 * Site Document Service
 * Handles site document-related API calls
 */

import { apiClient } from '@/core/api/client'
import type { SiteDocument } from '@/core/api/types'

export const siteDocumentService = {
    /**
     * Get all documents for a site
     */
    async getAll(siteId: string): Promise<SiteDocument[]> {
        return apiClient.get<SiteDocument[]>(`/sites/${siteId}/documents`)
    },

    /**
     * Upload a document to a site
     */
    /**
     * Upload a document to a site
     */
    async upload(siteId: string, data: { name: string; type: string; fileUrl: string; fileSize?: number; mimeType?: string }): Promise<SiteDocument> {
        return apiClient.post<SiteDocument>(`/sites/${siteId}/documents`, data)
    },

    /**
     * Delete a site document
     */
    async delete(siteId: string, documentId: string): Promise<void> {
        return apiClient.delete(`/sites/${siteId}/documents/${documentId}`)
    },

    /**
     * Get download URL for a document
     */
    getDownloadUrl(siteId: string, documentId: string): string {
        return `/sites/${siteId}/documents/${documentId}/download`
    },
}
