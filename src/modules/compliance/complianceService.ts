/**
 * Compliance Service
 * Handles regulatory and privacy endpoints
 */

import { apiClient } from '@/core/api/client'

export interface DsarRequest {
  id: string
  subject?: string
  region?: string
  receivedAt?: string
  dueAt?: string
  status?: string
}

export interface ExportJob {
  id: string
  dataset?: string
  range?: string
  size?: string
  status?: string
  requestedAt?: string
}

export interface RiskItem {
  id: string
  title?: string
  sev?: string
  owner?: string
  status?: string
}

export interface ComplianceChecklistItem {
  item: string
  ok: boolean
}

export interface PolicyVersion {
  policy: string
  version: string
  date: string
}

export interface PrivacyRequest {
  id: string
  requester?: string
  type?: string
  status?: string
  submittedAt?: string
  dueAt?: string
}

export const complianceService = {
  async getDsars(): Promise<DsarRequest[]> {
    return apiClient.get<DsarRequest[]>('/compliance/dsars')
  },

  async getExportJobs(): Promise<ExportJob[]> {
    return apiClient.get<ExportJob[]>('/compliance/exports')
  },

  async getRiskItems(): Promise<RiskItem[]> {
    return apiClient.get<RiskItem[]>('/compliance/risks')
  },

  async getChecklist(): Promise<ComplianceChecklistItem[]> {
    return apiClient.get<ComplianceChecklistItem[]>('/compliance/checklist')
  },

  async getPolicyVersions(): Promise<PolicyVersion[]> {
    return apiClient.get<PolicyVersion[]>('/compliance/policies')
  },

  async getPrivacyRequests(): Promise<PrivacyRequest[]> {
    return apiClient.get<PrivacyRequest[]>('/privacy/requests')
  },
}
