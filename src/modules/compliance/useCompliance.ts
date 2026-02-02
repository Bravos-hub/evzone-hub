/**
 * Compliance Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { complianceService } from './complianceService'

export function useDsars() {
  return useQuery({
    queryKey: ['compliance', 'dsars'],
    queryFn: () => complianceService.getDsars(),
  })
}

export function useExportJobs() {
  return useQuery({
    queryKey: ['compliance', 'exports'],
    queryFn: () => complianceService.getExportJobs(),
  })
}

export function useRiskItems() {
  return useQuery({
    queryKey: ['compliance', 'risks'],
    queryFn: () => complianceService.getRiskItems(),
  })
}

export function useComplianceChecklist() {
  return useQuery({
    queryKey: ['compliance', 'checklist'],
    queryFn: () => complianceService.getChecklist(),
  })
}

export function usePolicyVersions() {
  return useQuery({
    queryKey: ['compliance', 'policies'],
    queryFn: () => complianceService.getPolicyVersions(),
  })
}

export function usePrivacyRequests() {
  return useQuery({
    queryKey: ['compliance', 'privacy-requests'],
    queryFn: () => complianceService.getPrivacyRequests(),
  })
}
