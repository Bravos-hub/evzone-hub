/**
 * Application Service
 * Handles application CRUD operations
 */

import { apiClient } from '@/core/api/client'
import type {
    Application,
    CreateApplicationRequest,
    UpdateApplicationStatusRequest,
    ApplicationListFilters,
} from '../types'

export const applicationService = {
    /**
     * List applications with optional filters
     */
    async list(filters?: ApplicationListFilters): Promise<Application[]> {
        const params = new URLSearchParams()
        if (filters?.status) params.append('status', filters.status)
        if (filters?.siteId) params.append('siteId', filters.siteId)

        const queryString = params.toString()
        return apiClient.get<Application[]>(`/applications${queryString ? `?${queryString}` : ''}`)
    },

    /**
     * Get application by ID
     */
    async getById(id: string): Promise<Application> {
        return apiClient.get<Application>(`/applications/${id}`)
    },

    /**
     *Submit new application
     */
    async create(data: CreateApplicationRequest): Promise<Application> {
        return apiClient.post<Application>('/applications', data)
    },

    /**
     * Update application status (Admin/Site Owner)
     */
    async updateStatus(id: string, data: UpdateApplicationStatusRequest): Promise<Application> {
        return apiClient.patch<Application>(`/applications/${id}/status`, data)
    },

    /**
     * Withdraw application (Operator)
     */
    async withdraw(id: string): Promise<Application> {
        return apiClient.patch<Application>(`/applications/${id}/status`, {
            status: 'WITHDRAWN',
        })
    },

    /**
     * Admin: Activate tenant from application
     */
    async activate(id: string): Promise<{ tenant: any; application: Application }> {
        return apiClient.post(`/applications/${id}/activate`)
    },

    /**
     * Generate lease agreement draft
     */
    async generateLease(id: string): Promise<Application> {
        return apiClient.post<Application>(`/applications/${id}/lease/generate`)
    },

    /**
     * Send lease for e-signature
     */
    async sendForSignature(id: string): Promise<Application> {
        return apiClient.post<Application>(`/applications/${id}/lease/send-signature`)
    },

    /**
     * Upload signed lease document
     */
    async uploadLease(id: string, file: File): Promise<Application> {
        const formData = new FormData()
        formData.append('file', file)
        return apiClient.post<Application>(`/applications/${id}/lease/upload`, formData)
    },

    /**
     * Digitally sign lease
     */
    async signLease(id: string, signatureData: string): Promise<Application> {
        return apiClient.post<Application>(`/applications/${id}/lease/sign`, { signatureData })
    },
}
