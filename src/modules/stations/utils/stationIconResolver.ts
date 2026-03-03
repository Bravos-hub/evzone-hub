export type NormalizedStationType = 'CHARGING' | 'SWAP' | 'BOTH'

export type StationMarkerIconKey =
  | 'marker-available'
  | 'marker-inuse'
  | 'marker-unavailable'
  | 'marker-bat-available'
  | 'marker-bat-inuse'

export interface StationIconDecision {
  markerIcon: StationMarkerIconKey
  iconSrc: string
  iconAlt: string
}

export interface ChargeIconSignal {
  availableChargePoints?: number
  totalChargePoints?: number
}

export interface SwapIconSignal {
  readyBatteries?: number
  totalBatteries?: number
}

export interface StationIconInput {
  type?: string
  status?: string
  charge?: ChargeIconSignal
  swap?: SwapIconSignal
}

type IconMeta = {
  iconSrc: string
  iconAlt: string
}

const ICON_META: Record<StationMarkerIconKey, IconMeta> = {
  'marker-available': { iconSrc: '/available.svg', iconAlt: 'Available charge station' },
  'marker-inuse': { iconSrc: '/Inuse.svg', iconAlt: 'In-use charge station' },
  'marker-unavailable': { iconSrc: '/Unavailble.svg', iconAlt: 'Unavailable station' },
  'marker-bat-available': { iconSrc: '/Bat-avail.svg', iconAlt: 'Swap station with ready batteries' },
  'marker-bat-inuse': { iconSrc: '/Bat-inuse.svg', iconAlt: 'Swap station with all batteries in use' },
}

export function normalizeStationType(type?: string): NormalizedStationType {
  const normalized = (type ?? '').trim().toUpperCase()
  if (normalized === 'SWAP' || normalized === 'SWAPPING') return 'SWAP'
  if (normalized === 'BOTH') return 'BOTH'
  return 'CHARGING'
}

function normalizeCount(value?: number): number {
  if (value === undefined || value === null) return 0
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.round(parsed))
}

function hasChargeSignal(signal?: ChargeIconSignal): boolean {
  if (!signal) return false
  return signal.totalChargePoints !== undefined || signal.availableChargePoints !== undefined
}

function hasSwapSignal(signal?: SwapIconSignal): boolean {
  if (!signal) return false
  return signal.totalBatteries !== undefined || signal.readyBatteries !== undefined
}

function isServiceableStationStatus(status?: string): boolean {
  const normalized = (status ?? '').trim().toUpperCase()
  return normalized === 'ACTIVE' || normalized === 'ONLINE' || normalized === 'AVAILABLE'
}

function toDecision(markerIcon: StationMarkerIconKey): StationIconDecision {
  const meta = ICON_META[markerIcon]
  return {
    markerIcon,
    iconSrc: meta.iconSrc,
    iconAlt: meta.iconAlt,
  }
}

export function resolveChargeStationIcon(status?: string, signal?: ChargeIconSignal): StationIconDecision {
  if (!isServiceableStationStatus(status)) return toDecision('marker-unavailable')
  if (!hasChargeSignal(signal)) return toDecision('marker-unavailable')

  const totalChargePoints = normalizeCount(signal?.totalChargePoints)
  const availableChargePoints = normalizeCount(signal?.availableChargePoints)

  if (totalChargePoints <= 0) return toDecision('marker-unavailable')
  if (availableChargePoints > 0) return toDecision('marker-available')
  return toDecision('marker-inuse')
}

export function resolveSwapStationIcon(status?: string, signal?: SwapIconSignal): StationIconDecision {
  if (!isServiceableStationStatus(status)) return toDecision('marker-unavailable')
  if (!hasSwapSignal(signal)) return toDecision('marker-unavailable')

  const totalBatteries = normalizeCount(signal?.totalBatteries)
  const readyBatteries = normalizeCount(signal?.readyBatteries)

  if (totalBatteries <= 0) return toDecision('marker-unavailable')
  if (readyBatteries > 0) return toDecision('marker-bat-available')
  return toDecision('marker-bat-inuse')
}

export function resolveStationIcon(input: StationIconInput): StationIconDecision {
  const type = normalizeStationType(input.type)
  if (!isServiceableStationStatus(input.status)) return toDecision('marker-unavailable')

  if (type === 'CHARGING') return resolveChargeStationIcon(input.status, input.charge)
  if (type === 'SWAP') return resolveSwapStationIcon(input.status, input.swap)

  // BOTH: charge-first fallback, then swap
  if (hasChargeSignal(input.charge)) return resolveChargeStationIcon(input.status, input.charge)
  return resolveSwapStationIcon(input.status, input.swap)
}

