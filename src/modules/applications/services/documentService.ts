/**
 * Document Service
 * Handles document upload, listing, and verification
 */

import { apiClient } from '@/core/api/client'
import type {
    Document,
    DocumentUploadRequest,
    DocumentListFilters,
} from '../types'

export const documentService = {
    /**
     * Upload a document
     */
    async upload(
        entityType: 'site' | 'application',
        entityId: string,
        data: DocumentUploadRequest
    ): Promise<Document> {
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('category', data.category)
        if (data.expiryDate) formData.append('expiryDate', data.expiryDate)
        if (data.notes) formData.append('notes', data.notes)

        const endpoint = entityType === 'site'
            ? `/sites/${entityId}/documents`
            : `/applications/${entityId}/documents`

        return apiClient.post<Document>(endpoint, formData)
    },

    /**
     * List documents for an entity
     */
    async list(
        entityType: 'site' | 'application',
        entityId: string,
        filters?: DocumentListFilters
    ): Promise<Document[]> {
        const params = new URLSearchParams()
        if (filters?.status) params.append('status', filters.status)
        if (filters?.category) params.append('category', filters.category)

        const endpoint = entityType === 'site'
            ? `/sites/${entityId}/documents`
            : `/applications/${entityId}/documents`

        const queryString = params.toString()
        return apiClient.get<Document[]>(`${endpoint}${queryString ? `?${queryString}` : ''}`)
    },

    /**
     * Delete a document
     */
    async delete(entityType: 'site' | 'application', entityId: string, docId: string): Promise<void> {
        const endpoint = entityType === 'site'
            ? `/sites/${entityId}/documents/${docId}`
            : `/applications/${entityId}/documents/${docId}`

        return apiClient.delete(endpoint)
    },

    /**
     * Admin: Verify document
     */
    async verify(docId: string): Promise<Document> {
        return apiClient.patch<Document>(`/documents/${docId}/verify`)
    },

    /**
     * Admin: Reject document
     */
    async reject(docId: string, reason: string): Promise<Document> {
        return apiClient.patch<Document>(`/documents/${docId}/reject`, { reason })
    },

    /**
     * Admin: Get all pending documents
     */
    async getPending(): Promise<Document[]> {
        return apiClient.get<Document[]>('/admin/documents/pending')
    },
}
