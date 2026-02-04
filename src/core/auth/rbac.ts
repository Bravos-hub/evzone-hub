import type { OwnerCapability, Role } from '@/core/auth/types'
import { ROLE_GROUPS } from '@/constants/roles'

export type StationAccessTarget = {
  id?: string
  code?: string
  orgId?: string
  type?: string
  ownerId?: string
}

export type StationAccessContext = {
  role?: Role
  userId?: string
  orgId?: string
  assignedStations?: string[]
  capability?: OwnerCapability
  viewAll?: boolean
}

type NormalizedStationType = 'CHARGE' | 'SWAP' | 'BOTH'
export type StationScope = 'CHARGE' | 'SWAP' | 'ANY'

export function normalizeStationType(type?: string): NormalizedStationType | null {
  if (!type) return null
  const normalized = type.trim().toUpperCase()
  if (normalized === 'CHARGING' || normalized === 'CHARGE') return 'CHARGE'
  if (normalized === 'SWAP') return 'SWAP'
  if (normalized === 'BOTH') return 'BOTH'
  return null
}

export function capabilityAllowsStation(capability: OwnerCapability | undefined, stationType?: string): boolean {
  if (!capability || capability === 'BOTH') return true
  const normalizedType = normalizeStationType(stationType)
  if (!normalizedType) return true
  if (capability === 'CHARGE') return normalizedType === 'CHARGE' || normalizedType === 'BOTH'
  if (capability === 'SWAP') return normalizedType === 'SWAP' || normalizedType === 'BOTH'
  return true
}

export function capabilityAllowsScope(capability: OwnerCapability | undefined, scope: StationScope): boolean {
  if (!capability || capability === 'BOTH') return true
  if (scope === 'ANY') return true
  return capability === scope
}

export function stationMatchesScope(stationType: string | undefined, scope: StationScope): boolean {
  if (scope === 'ANY') return true
  const normalizedType = normalizeStationType(stationType)
  if (!normalizedType) return true
  if (scope === 'CHARGE') return normalizedType === 'CHARGE' || normalizedType === 'BOTH'
  if (scope === 'SWAP') return normalizedType === 'SWAP' || normalizedType === 'BOTH'
  return true
}

export function capabilityAllowsCharge(capability: OwnerCapability | undefined): boolean {
  return !capability || capability === 'BOTH' || capability === 'CHARGE'
}

export function capabilityAllowsSwap(capability: OwnerCapability | undefined): boolean {
  return !capability || capability === 'BOTH' || capability === 'SWAP'
}

export function canAccessStation(ctx: StationAccessContext, station?: StationAccessTarget, scope: StationScope = 'ANY'): boolean {
  if (!ctx.role) return false
  if (!station) return false

  const stationTypeAllowed = scope === 'ANY'
    ? capabilityAllowsStation(ctx.capability, station.type)
    : capabilityAllowsScope(ctx.capability, scope) && stationMatchesScope(station.type, scope)
  if (!stationTypeAllowed) return false

  if (ctx.viewAll || ROLE_GROUPS.PLATFORM_OPS.includes(ctx.role)) return true

  if (ctx.role === 'STATION_OWNER') {
    // 1. Direct Ownership (Fallback if Org is missing)
    if (ctx.userId && station.ownerId && ctx.userId === station.ownerId) return true

    // 2. Org Match
    if (!ctx.orgId || !station.orgId) return false
    return ctx.orgId === station.orgId
  }

  if (ctx.role === 'STATION_OPERATOR') {
    const assigned = ctx.assignedStations || []
    if (assigned.length === 0) return false
    const idMatch = station.id ? assigned.includes(station.id) : false
    const codeMatch = station.code ? assigned.includes(station.code) : false
    return idMatch || codeMatch
  }

  return true
}

