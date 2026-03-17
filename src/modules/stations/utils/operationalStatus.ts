import type { StationStatus } from '@/ui/components/StationStatusPill'
import { normalizeStationType } from './stationIconResolver'

export type ApiOperationalStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE'
export type StationMapLifecycleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'

type StationLike = {
  status?: string
  operationalStatus?: string
  type?: string
}

function normalizeLifecycleStatus(value?: string): 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'UNKNOWN' {
  const normalized = (value ?? '').trim().toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'ONLINE' || normalized === 'AVAILABLE') return 'ACTIVE'
  if (normalized === 'INACTIVE' || normalized === 'OFFLINE' || normalized === 'UNAVAILABLE' || normalized === 'FAULTED') return 'INACTIVE'
  if (normalized === 'MAINTENANCE') return 'MAINTENANCE'
  return 'UNKNOWN'
}

function normalizeOperationalStatus(value?: string): ApiOperationalStatus | undefined {
  const normalized = (value ?? '').trim().toUpperCase()
  if (
    normalized === 'ONLINE' ||
    normalized === 'DEGRADED' ||
    normalized === 'OFFLINE' ||
    normalized === 'MAINTENANCE'
  ) {
    return normalized
  }
  return undefined
}

function mapLifecycleToUiStatus(value?: string): StationStatus {
  const lifecycle = normalizeLifecycleStatus(value)
  if (lifecycle === 'ACTIVE') return 'Online'
  if (lifecycle === 'INACTIVE') return 'Offline'
  if (lifecycle === 'MAINTENANCE') return 'Maintenance'
  return 'Degraded'
}

function mapOperationalToUiStatus(value: ApiOperationalStatus): StationStatus {
  if (value === 'ONLINE') return 'Online'
  if (value === 'OFFLINE') return 'Offline'
  if (value === 'MAINTENANCE') return 'Maintenance'
  return 'Degraded'
}

function isChargeCapableStation(type?: string): boolean {
  const normalizedType = normalizeStationType(type)
  return normalizedType === 'CHARGING' || normalizedType === 'BOTH'
}

export function resolveStationUiStatus(station: StationLike): StationStatus {
  const lifecycleStatus = mapLifecycleToUiStatus(station.status)
  if (!isChargeCapableStation(station.type)) return lifecycleStatus

  const operationalStatus = normalizeOperationalStatus(station.operationalStatus)
  if (!operationalStatus) return lifecycleStatus
  return mapOperationalToUiStatus(operationalStatus)
}

export function resolveStationMapLifecycleStatus(station: StationLike): StationMapLifecycleStatus {
  const uiStatus = resolveStationUiStatus(station)
  if (uiStatus === 'Online') return 'ACTIVE'
  if (uiStatus === 'Offline') return 'INACTIVE'
  return 'MAINTENANCE'
}

export function resolveStationIconStatusInput(station: StationLike): string | undefined {
  if (!isChargeCapableStation(station.type)) return station.status
  return normalizeOperationalStatus(station.operationalStatus) ?? station.status
}
