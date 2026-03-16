/**
 * Charge Point Service
 * Handles charge point-related API calls
 */

import { apiClient } from '@/core/api/client'
import type { ChargePoint } from '@/core/types/domain'
import type { CreateChargePointRequest, UpdateChargePointRequest } from '@/core/api/types'

export type ChargePointSecurityState = {
  chargePointId: string
  ocppId: string
  authProfile: 'basic' | 'mtls_bootstrap' | 'mtls'
  bootstrapEnabled: boolean
  bootstrapExpiresAt?: string
  allowedIps: string[]
  allowedCidrs: string[]
  requiresClientCertificate: boolean
  certificatesCount: number
}

export type ChargePointCommandResponse = {
  commandId: string
  status: string
  requestedAt: string
  error?: string
  message?: string
  commandType?: string
  chargePointId?: string
  stationId?: string
}

export type ChargePointCommandStatus =
  | 'Queued'
  | 'Sent'
  | 'Dispatched'
  | 'Accepted'
  | 'Rejected'
  | 'Failed'
  | 'Timeout'
  | 'Duplicate'
  | 'NOT_FOUND'
  | string

export type ChargePointCommandLifecycle = {
  id: string
  commandType?: string
  stationId?: string | null
  chargePointId?: string | null
  connectorId?: string | null
  status: ChargePointCommandStatus
  requestedAt?: string | null
  sentAt?: string | null
  completedAt?: string | null
  error?: string | null
}

export type WaitForCommandOptions = {
  intervalMs?: number
  timeoutMs?: number
  onUpdate?: (status: ChargePointCommandLifecycle) => void
}

const TERMINAL_COMMAND_STATUSES = new Set<ChargePointCommandStatus>([
  'Accepted',
  'Rejected',
  'Failed',
  'Timeout',
  'Duplicate',
  'NOT_FOUND',
])

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export type ChargePointRemoteStartRequest = {
  connectorId?: number
  evseId?: number
  idTag?: string
  remoteStartId?: number
}

export type ChargePointUnlockRequest = {
  connectorId?: number
  evseId?: number
}

export const chargePointService = {
  /**
   * Get all charge points
   */
  async getAll(query?: { stationId?: string; status?: string }): Promise<ChargePoint[]> {
    const params = new URLSearchParams()
    if (query?.stationId) params.append('stationId', query.stationId)
    if (query?.status) params.append('status', query.status)

    const queryString = params.toString()
    return apiClient.get<ChargePoint[]>(`/charge-points${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * Get charge point by ID
   */
  async getById(id: string): Promise<ChargePoint> {
    return apiClient.get<ChargePoint>(`/charge-points/${id}`)
  },

  /**
   * Get charge point by OCPP ID
   */
  async getByOcppId(ocppId: string): Promise<ChargePoint | null> {
    return apiClient.get<ChargePoint | null>(`/charge-points/by-ocpp/${encodeURIComponent(ocppId)}`)
  },

  /**
   * Get charge points by station ID
   */
  async getByStationId(stationId: string): Promise<ChargePoint[]> {
    return apiClient.get<ChargePoint[]>(`/charge-points?stationId=${stationId}`)
  },

  /**
   * Create charge point
   */
  async create(data: CreateChargePointRequest): Promise<ChargePoint> {
    return apiClient.post<ChargePoint>('/charge-points', data)
  },

  /**
   * Update charge point
   */
  async update(id: string, data: UpdateChargePointRequest): Promise<ChargePoint> {
    return apiClient.patch<ChargePoint>(`/charge-points/${id}`, data)
  },

  /**
   * Delete charge point
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/charge-points/${id}`)
  },

  /**
   * Reboot charge point
   */
  async reboot(id: string): Promise<ChargePointCommandResponse> {
    return apiClient.post<ChargePointCommandResponse>(`/charge-points/${id}/reboot`)
  },

  async softReset(id: string): Promise<ChargePointCommandResponse> {
    return apiClient.post<ChargePointCommandResponse>(`/charge-points/${id}/commands/soft-reset`)
  },

  async remoteStart(
    id: string,
    data: ChargePointRemoteStartRequest
  ): Promise<ChargePointCommandResponse> {
    return apiClient.post<ChargePointCommandResponse>(`/charge-points/${id}/commands/remote-start`, data)
  },

  async unlockConnector(
    id: string,
    data: ChargePointUnlockRequest
  ): Promise<ChargePointCommandResponse> {
    return apiClient.post<ChargePointCommandResponse>(`/charge-points/${id}/commands/unlock`, data)
  },

  async getCommandStatus(commandId: string): Promise<ChargePointCommandLifecycle> {
    return apiClient.get<ChargePointCommandLifecycle>(`/commands/${commandId}`)
  },

  async listCommands(query: {
    chargePointId: string
    stationId?: string
    limit?: number
  }): Promise<ChargePointCommandLifecycle[]> {
    const params = new URLSearchParams()
    params.set('chargePointId', query.chargePointId)
    if (query.stationId) params.set('stationId', query.stationId)
    if (typeof query.limit === 'number') params.set('limit', String(query.limit))
    return apiClient.get<ChargePointCommandLifecycle[]>(`/commands?${params.toString()}`)
  },

  async waitForCommandTerminal(
    commandId: string,
    options: WaitForCommandOptions = {}
  ): Promise<ChargePointCommandLifecycle> {
    const intervalMs = Math.max(options.intervalMs ?? 2000, 500)
    const timeoutMs = Math.max(options.timeoutMs ?? 45000, intervalMs)
    const startedAt = Date.now()

    let latest = await this.getCommandStatus(commandId)
    options.onUpdate?.(latest)
    while (!TERMINAL_COMMAND_STATUSES.has(latest.status)) {
      if (Date.now() - startedAt >= timeoutMs) {
        return {
          ...latest,
          status: 'Timeout',
          error: latest.error || 'Timed out while waiting for command completion',
        }
      }
      await sleep(intervalMs)
      latest = await this.getCommandStatus(commandId)
      options.onUpdate?.(latest)
    }
    return latest
  },

  async getSecurity(id: string): Promise<ChargePointSecurityState> {
    return apiClient.get<ChargePointSecurityState>(`/charge-points/${id}/security`)
  },

  async bindCertificate(
    id: string,
    data: { fingerprint: string; subject?: string; validFrom?: string; validTo?: string }
  ): Promise<{
    status: string
    chargePointId: string
    ocppId: string
    fingerprint: string
    authProfile: 'mtls'
    requiresClientCertificate: boolean
  }> {
    return apiClient.post(`/charge-points/${id}/security/certificate-bind`, data)
  },

  async updateBootstrap(
    id: string,
    data: { enabled: boolean; ttlMinutes?: number; allowedIps?: string[]; allowedCidrs?: string[] }
  ): Promise<ChargePointSecurityState> {
    return apiClient.patch<ChargePointSecurityState>(`/charge-points/${id}/security/bootstrap`, data)
  },
}
