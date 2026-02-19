/**
 * Provider Service
 * Handles battery swapping provider-related API calls
 */

import { apiClient } from '@/core/api/client'
import { ApiException } from '@/core/api/errors'
import type {
    CompliancePolicyRecord,
    CreateProviderDocumentRequest,
    CreateProviderRelationshipRequest,
    CreateSwapProviderRequest,
    ProviderCompliancePolicy,
    ProviderComplianceStatus,
    ProviderDocument,
    ProviderRequirementDefinition,
    ProviderRequirementScope,
    ProviderRelationship,
    ReviewProviderDocumentRequest,
    ProviderSettlementSummary,
    SwapProvider,
    UpdateComplianceProfileRequest,
    UploadProviderDocumentRequest,
    UpdateSwapProviderRequest,
} from '@/core/api/types'

export type ProviderListFilters = {
    region?: string
    standard?: string
    status?: string
    orgId?: string
    ownerOrgId?: string
    relationshipStatus?: string
    includeOnlyEligible?: boolean
    my?: boolean
}

type RelationshipFilters = {
    ownerOrgId?: string
    providerId?: string
    status?: string
    my?: boolean
}

type SettlementFilters = {
    providerId?: string
    ownerOrgId?: string
    startDate?: string
    endDate?: string
    my?: boolean
}

type DocumentFilters = {
    providerId?: string
    relationshipId?: string
    my?: boolean
}

type RequirementFilters = {
    appliesTo?: ProviderRequirementScope
}

const appendQueryValue = (params: URLSearchParams, key: string, value?: string | boolean) => {
    if (value === undefined || value === null || value === '') return
    params.append(key, String(value))
}

const isNotFoundError = (error: unknown): boolean =>
    error instanceof ApiException && error.statusCode === 404

const normalizeListPayload = <T>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[]
    if (!payload || typeof payload !== 'object') return []

    const record = payload as Record<string, unknown>
    if (Array.isArray(record.data)) return record.data as T[]
    if (Array.isArray(record.items)) return record.items as T[]
    if (Array.isArray(record.results)) return record.results as T[]
    return []
}

export const providerService = {
    /**
     * Get all swapping providers
     */
    async getAll(query?: ProviderListFilters): Promise<SwapProvider[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'region', query?.region)
        appendQueryValue(params, 'standard', query?.standard)
        appendQueryValue(params, 'status', query?.status)
        appendQueryValue(params, 'orgId', query?.orgId)
        appendQueryValue(params, 'ownerOrgId', query?.ownerOrgId)
        appendQueryValue(params, 'relationshipStatus', query?.relationshipStatus)
        appendQueryValue(params, 'includeOnlyEligible', query?.includeOnlyEligible)
        appendQueryValue(params, 'my', query?.my)

        const queryString = params.toString()
        return apiClient.get<SwapProvider[]>(`/providers${queryString ? `?${queryString}` : ''}`)
    },

    async getMarketplaceAll(query?: ProviderListFilters): Promise<SwapProvider[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'region', query?.region)
        appendQueryValue(params, 'standard', query?.standard)
        appendQueryValue(params, 'status', query?.status)
        const queryString = params.toString()
        try {
            const payload = await apiClient.get<unknown>(`/providers/marketplace${queryString ? `?${queryString}` : ''}`)
            const rows = normalizeListPayload<SwapProvider>(payload)
            if (rows.length > 0 || Array.isArray(payload)) return rows
        } catch (error) {
            if (!isNotFoundError(error)) throw error
        }

        try {
            const fallbackPayload = await apiClient.get<unknown>(`/providers${queryString ? `?${queryString}` : ''}`)
            return normalizeListPayload<SwapProvider>(fallbackPayload)
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },

    /**
     * Get provider by ID
     */
    async getById(id: string): Promise<SwapProvider> {
        return apiClient.get<SwapProvider>(`/providers/${id}`)
    },

    async getMarketplaceById(id: string): Promise<SwapProvider> {
        try {
            return await apiClient.get<SwapProvider>(`/providers/marketplace/${id}`)
        } catch (error) {
            if (isNotFoundError(error)) {
                return apiClient.get<SwapProvider>(`/providers/${id}`)
            }
            throw error
        }
    },

    async create(data: CreateSwapProviderRequest): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>('/providers', data)
    },

    async update(id: string, data: UpdateSwapProviderRequest): Promise<SwapProvider> {
        return apiClient.patch<SwapProvider>(`/providers/${id}`, data)
    },

    async submitForReview(id: string): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>(`/providers/${id}/submit`, {})
    },

    async approve(id: string, notes?: string): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>(`/providers/${id}/approve`, notes ? { notes } : {})
    },

    async reject(id: string, reason: string): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>(`/providers/${id}/reject`, { reason })
    },

    async suspend(id: string, reason?: string): Promise<SwapProvider> {
        return apiClient.post<SwapProvider>(`/providers/${id}/suspend`, reason ? { reason } : {})
    },

    async listDocuments(filters?: DocumentFilters): Promise<ProviderDocument[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'providerId', filters?.providerId)
        appendQueryValue(params, 'relationshipId', filters?.relationshipId)
        appendQueryValue(params, 'my', filters?.my)
        const queryString = params.toString()
        return apiClient.get<ProviderDocument[]>(`/provider-documents${queryString ? `?${queryString}` : ''}`)
    },

    async uploadDocument(data: UploadProviderDocumentRequest): Promise<ProviderDocument> {
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('type', data.type)
        formData.append('name', data.name)
        if (data.providerId) formData.append('providerId', data.providerId)
        if (data.relationshipId) formData.append('relationshipId', data.relationshipId)
        if (data.requirementCode) formData.append('requirementCode', data.requirementCode)
        if (data.category) formData.append('category', data.category)
        if (data.issuer) formData.append('issuer', data.issuer)
        if (data.documentNumber) formData.append('documentNumber', data.documentNumber)
        if (data.issueDate) formData.append('issueDate', data.issueDate)
        if (data.expiryDate) formData.append('expiryDate', data.expiryDate)
        if (data.version) formData.append('version', data.version)
        if (data.coveredModels?.length) formData.append('coveredModels', data.coveredModels.join(','))
        if (data.coveredSites?.length) formData.append('coveredSites', data.coveredSites.join(','))
        if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata))
        return apiClient.post<ProviderDocument>('/provider-documents/upload', formData)
    },

    async uploadDocumentLegacy(data: CreateProviderDocumentRequest & { providerId?: string; relationshipId?: string }): Promise<ProviderDocument> {
        return apiClient.post<ProviderDocument>('/provider-documents', data)
    },

    async reviewDocument(id: string, data: ReviewProviderDocumentRequest): Promise<ProviderDocument> {
        return apiClient.patch<ProviderDocument>(`/provider-documents/${id}`, data)
    },

    async deleteDocument(id: string): Promise<void> {
        return apiClient.delete<void>(`/provider-documents/${id}`)
    },

    async getRequirementCatalog(filters?: RequirementFilters): Promise<ProviderRequirementDefinition[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'appliesTo', filters?.appliesTo)
        const queryString = params.toString()
        try {
            const payload = await apiClient.get<unknown>(`/provider-requirements${queryString ? `?${queryString}` : ''}`)
            const rows = normalizeListPayload<ProviderRequirementDefinition>(payload)
            if (rows.length > 0 || Array.isArray(payload)) return rows
        } catch (error) {
            if (!isNotFoundError(error)) throw error
        }

        try {
            const fallbackPayload = await apiClient.get<unknown>(`/providers/requirements${queryString ? `?${queryString}` : ''}`)
            return normalizeListPayload<ProviderRequirementDefinition>(fallbackPayload)
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },

    async getComplianceStatus(providerId: string): Promise<ProviderComplianceStatus> {
        return apiClient.get<ProviderComplianceStatus>(`/providers/${providerId}/compliance-status`)
    },

    async getComplianceStatuses(providerIds: string[]): Promise<ProviderComplianceStatus[]> {
        const params = new URLSearchParams()
        if (providerIds.length > 0) {
            params.set('providerIds', providerIds.join(','))
        }
        const queryString = params.toString()
        return apiClient.get<ProviderComplianceStatus[]>(`/providers/compliance-statuses${queryString ? `?${queryString}` : ''}`)
    },

    async getRelationships(filters?: RelationshipFilters): Promise<ProviderRelationship[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'ownerOrgId', filters?.ownerOrgId)
        appendQueryValue(params, 'providerId', filters?.providerId)
        appendQueryValue(params, 'status', filters?.status)
        appendQueryValue(params, 'my', filters?.my)
        const queryString = params.toString()
        try {
            const payload = await apiClient.get<unknown>(`/provider-relationships${queryString ? `?${queryString}` : ''}`)
            const rows = normalizeListPayload<ProviderRelationship>(payload)
            if (rows.length > 0 || Array.isArray(payload)) return rows
        } catch (error) {
            if (!isNotFoundError(error)) throw error
        }

        try {
            const fallbackPayload = await apiClient.get<unknown>(`/providers/relationships${queryString ? `?${queryString}` : ''}`)
            return normalizeListPayload<ProviderRelationship>(fallbackPayload)
        } catch (error) {
            if (isNotFoundError(error)) return []
            throw error
        }
    },

    async requestRelationship(data: CreateProviderRelationshipRequest): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>('/provider-relationships', data)
    },

    async respondToRelationship(id: string, action: 'ACCEPT' | 'REJECT', notes?: string): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>(`/provider-relationships/${id}/respond`, { action, notes })
    },

    async approveRelationship(id: string, notes?: string): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>(`/provider-relationships/${id}/approve`, notes ? { notes } : {})
    },

    async suspendRelationship(id: string, reason?: string): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>(`/provider-relationships/${id}/suspend`, reason ? { reason } : {})
    },

    async terminateRelationship(id: string, reason?: string): Promise<ProviderRelationship> {
        return apiClient.post<ProviderRelationship>(`/provider-relationships/${id}/terminate`, reason ? { reason } : {})
    },

    async getRelationshipComplianceStatus(relationshipId: string): Promise<ProviderComplianceStatus> {
        return apiClient.get<ProviderComplianceStatus>(`/provider-relationships/${relationshipId}/compliance-status`)
    },

    async getRelationshipComplianceStatuses(relationshipIds: string[]): Promise<ProviderComplianceStatus[]> {
        const params = new URLSearchParams()
        if (relationshipIds.length > 0) {
            params.set('relationshipIds', relationshipIds.join(','))
        }
        const queryString = params.toString()
        return apiClient.get<ProviderComplianceStatus[]>(
            `/provider-relationships/compliance-statuses${queryString ? `?${queryString}` : ''}`,
        )
    },

    async updateProviderComplianceProfile(id: string, data: UpdateComplianceProfileRequest): Promise<SwapProvider> {
        return apiClient.patch<SwapProvider>(`/providers/${id}/compliance-profile`, data)
    },

    async updateRelationshipComplianceProfile(id: string, data: UpdateComplianceProfileRequest): Promise<ProviderRelationship> {
        return apiClient.patch<ProviderRelationship>(`/provider-relationships/${id}/compliance-profile`, data)
    },

    async getCompliancePolicy(): Promise<CompliancePolicyRecord> {
        return apiClient.get<CompliancePolicyRecord>('/compliance-policies/provider')
    },

    async updateCompliancePolicy(data: Partial<ProviderCompliancePolicy>): Promise<CompliancePolicyRecord> {
        return apiClient.patch<CompliancePolicyRecord>('/compliance-policies/provider', data)
    },

    async getSettlementSummary(filters?: SettlementFilters): Promise<ProviderSettlementSummary> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'providerId', filters?.providerId)
        appendQueryValue(params, 'ownerOrgId', filters?.ownerOrgId)
        appendQueryValue(params, 'startDate', filters?.startDate)
        appendQueryValue(params, 'endDate', filters?.endDate)
        appendQueryValue(params, 'my', filters?.my)
        const queryString = params.toString()
        return apiClient.get<ProviderSettlementSummary>(`/providers/settlements/summary${queryString ? `?${queryString}` : ''}`)
    },

    async getEligibleForOwner(ownerOrgId?: string): Promise<SwapProvider[]> {
        const params = new URLSearchParams()
        appendQueryValue(params, 'ownerOrgId', ownerOrgId)
        const queryString = params.toString()
        return apiClient.get<SwapProvider[]>(`/providers/eligible${queryString ? `?${queryString}` : ''}`)
    },
}
