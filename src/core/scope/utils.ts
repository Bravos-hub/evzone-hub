import type { Scope } from '@/core/auth/types'

// Region code mapping used across mock data
const REGION_MAP: Record<string, string[]> = {
  AFRICA: ['AFRICA', 'AF'],
  EUROPE: ['EUROPE', 'EU'],
  AMERICAS: ['AMERICAS', 'N_AMERICA', 'NA', 'NORTH_AMERICA'],
  ASIA: ['ASIA'],
  MIDDLE_EAST: ['MIDDLE_EAST', 'ME'],
}

/** Check if a region value from data is within the current scope */
export function regionInScope(scope: Scope, value?: string): boolean {
  if (!value || scope.region === 'ALL') return true
  const normalized = value.replace(/\s+/g, '_').toUpperCase()
  const candidates = REGION_MAP[scope.region] ?? [scope.region]
  return candidates.includes(normalized)
}

/** Check if org matches scope (scope.orgId === 'ALL' means allow all) */
export function orgInScope(scope: Scope, orgId?: string): boolean {
  if (scope.orgId === 'ALL') return true
  if (!orgId) return true
  return orgId === scope.orgId
}

/** Check if station matches scope (scope.stationId === 'ALL' means allow all) */
export function stationInScope(scope: Scope, stationId?: string): boolean {
  if (scope.stationId === 'ALL') return true
  if (!stationId) return true
  return stationId === scope.stationId
}

/** Generic helper to test a record against scope fields */
export function isInScope(
  scope: Scope,
  target: { region?: string; orgId?: string; stationId?: string }
): boolean {
  return (
    regionInScope(scope, target.region) &&
    orgInScope(scope, target.orgId) &&
    stationInScope(scope, target.stationId)
  )
}


