import { PATHS } from '@/app/router/paths'
import type { User } from '@/core/api/types'
import type { OwnerCapability, Role, UserProfile } from '@/core/auth/types'
import { hasPermission } from '@/constants/permissions'

export type StationCreationTarget = 'CHARGE' | 'SWAP'

type ViewerLike = Pick<UserProfile, 'id' | 'role' | 'ownerCapability'> | Pick<User, 'id' | 'role' | 'ownerCapability'>

export type StationCreationViewerContext = {
  userId?: string
  role?: Role
  ownerCapability?: OwnerCapability
  isStationOwner: boolean
  canCreateStations: boolean
  canCreateSwapStations: boolean
  requiresOwnerCapabilityChoice: boolean
}

function resolveRole(authUser?: ViewerLike | null, me?: ViewerLike | null): Role | undefined {
  return (me?.role ?? authUser?.role) as Role | undefined
}

function resolveOwnerCapability(
  authUser?: ViewerLike | null,
  me?: ViewerLike | null
): OwnerCapability | undefined {
  return me?.ownerCapability ?? authUser?.ownerCapability
}

export function resolveViewerContext(
  authUser?: ViewerLike | null,
  me?: ViewerLike | null
): StationCreationViewerContext {
  const role = resolveRole(authUser, me)
  const ownerCapability = resolveOwnerCapability(authUser, me)
  const isStationOwner = role === 'STATION_OWNER'
  const requiresOwnerCapabilityChoice = isStationOwner && !ownerCapability

  return {
    userId: me?.id ?? authUser?.id,
    role,
    ownerCapability,
    isStationOwner,
    canCreateStations: hasPermission(role, 'stations', 'create'),
    canCreateSwapStations: hasPermission(role, 'swapStations', 'create'),
    requiresOwnerCapabilityChoice,
  }
}

export function canCreateChargeStation(ctx: StationCreationViewerContext): boolean {
  if (!ctx.canCreateStations) return false
  if (!ctx.isStationOwner) return true
  if (ctx.requiresOwnerCapabilityChoice) return false
  return ctx.ownerCapability === 'CHARGE' || ctx.ownerCapability === 'BOTH'
}

export function canCreateSwapStation(ctx: StationCreationViewerContext): boolean {
  if (!ctx.canCreateSwapStations) return false
  if (!ctx.isStationOwner) return true
  if (ctx.requiresOwnerCapabilityChoice) return false
  return ctx.ownerCapability === 'SWAP' || ctx.ownerCapability === 'BOTH'
}

export function resolveAllowedTargets(ctx: StationCreationViewerContext): StationCreationTarget[] {
  const targets: StationCreationTarget[] = []
  if (canCreateChargeStation(ctx)) targets.push('CHARGE')
  if (canCreateSwapStation(ctx)) targets.push('SWAP')
  return targets
}

export function resolveChoiceTargets(ctx: StationCreationViewerContext): StationCreationTarget[] {
  if (ctx.requiresOwnerCapabilityChoice) return ['CHARGE', 'SWAP']
  return resolveAllowedTargets(ctx)
}

export function stationCreationTargetPath(target: StationCreationTarget): string {
  return target === 'CHARGE' ? PATHS.OWNER.ADD_CHARGE_STATION : PATHS.OWNER.ADD_SWAP_STATION
}
