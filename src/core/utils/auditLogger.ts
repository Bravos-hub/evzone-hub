/**
 * Audit Logger Utility
 * Generates client-side audit events and stores them in mock DB
 */

import { mockDb, type AuditLogEntry } from '@/data/mockDb'
import type { User } from '@/core/auth/types'

export type AuditCategory = 'Auth' | 'Config' | 'User' | 'Station' | 'Billing' | 'System'
export type AuditSeverity = 'Info' | 'Warning' | 'Critical'

interface AuditLogOptions {
  actor?: string
  actorRole?: string
  category: AuditCategory
  action: string
  target: string
  details?: string
  severity?: AuditSeverity
  ip?: string
}

/**
 * Get current user from auth store (helper)
 */
function getCurrentUser(): { id: string; name: string; role: string } | null {
  try {
    const userStr = localStorage.getItem('evzone:user')
    if (!userStr) return null
    const user = JSON.parse(userStr)
    return {
      id: user.id || 'system',
      name: user.name || 'System',
      role: user.role || 'SYSTEM',
    }
  } catch {
    return null
  }
}

/**
 * Get client IP (mock - in real app would get from request)
 */
function getClientIP(): string {
  // In MVP, return a mock IP
  return '192.168.1.1'
}

/**
 * Log an audit event
 */
export function logAuditEvent(options: AuditLogOptions): void {
  const user = getCurrentUser()
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
  
  const entry: AuditLogEntry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    actor: options.actor || user?.name || 'System',
    actorRole: options.actorRole || user?.role || 'SYSTEM',
    category: options.category,
    action: options.action,
    target: options.target,
    details: options.details || '',
    ip: options.ip || getClientIP(),
    severity: options.severity || 'Info',
  }

  mockDb.addAuditLog(entry)
}

/**
 * Convenience functions for common audit events
 */
export const auditLogger = {
  // User events
  userCreated: (userId: string, userName: string) => {
    logAuditEvent({
      category: 'User',
      action: 'User created',
      target: userId,
      details: `Created user: ${userName}`,
      severity: 'Info',
    })
  },

  userUpdated: (userId: string, changes: string) => {
    logAuditEvent({
      category: 'User',
      action: 'User updated',
      target: userId,
      details: changes,
      severity: 'Info',
    })
  },

  userDeleted: (userId: string, userName: string) => {
    logAuditEvent({
      category: 'User',
      action: 'User deleted',
      target: userId,
      details: `Deleted user: ${userName}`,
      severity: 'Warning',
    })
  },

  userSuspended: (userId: string, reason?: string) => {
    logAuditEvent({
      category: 'User',
      action: 'User suspended',
      target: userId,
      details: reason || 'User account suspended',
      severity: 'Warning',
    })
  },

  // Station events
  stationCreated: (stationId: string, stationName: string) => {
    logAuditEvent({
      category: 'Station',
      action: 'Station created',
      target: stationId,
      details: `Created station: ${stationName}`,
      severity: 'Info',
    })
  },

  stationUpdated: (stationId: string, changes: string) => {
    logAuditEvent({
      category: 'Station',
      action: 'Station updated',
      target: stationId,
      details: changes,
      severity: 'Info',
    })
  },

  stationDeleted: (stationId: string, stationName: string) => {
    logAuditEvent({
      category: 'Station',
      action: 'Station deleted',
      target: stationId,
      details: `Deleted station: ${stationName}`,
      severity: 'Warning',
    })
  },

  // Charge Point events
  chargePointCreated: (chargePointId: string, stationId: string) => {
    logAuditEvent({
      category: 'Station',
      action: 'Charge point created',
      target: chargePointId,
      details: `Created charge point at station: ${stationId}`,
      severity: 'Info',
    })
  },

  chargePointUpdated: (chargePointId: string, changes: string) => {
    logAuditEvent({
      category: 'Station',
      action: 'Charge point updated',
      target: chargePointId,
      details: changes,
      severity: 'Info',
    })
  },

  // Session events
  sessionStopped: (sessionId: string, reason?: string) => {
    logAuditEvent({
      category: 'System',
      action: 'Session stopped',
      target: sessionId,
      details: reason || 'Session manually stopped',
      severity: 'Info',
    })
  },

  // Incident events
  incidentCreated: (incidentId: string, title: string) => {
    logAuditEvent({
      category: 'System',
      action: 'Incident created',
      target: incidentId,
      details: `Incident: ${title}`,
      severity: 'Warning',
    })
  },

  incidentResolved: (incidentId: string) => {
    logAuditEvent({
      category: 'System',
      action: 'Incident resolved',
      target: incidentId,
      details: 'Incident marked as resolved',
      severity: 'Info',
    })
  },

  // Dispatch events
  dispatchCreated: (dispatchId: string, title: string) => {
    logAuditEvent({
      category: 'System',
      action: 'Dispatch created',
      target: dispatchId,
      details: `Dispatch: ${title}`,
      severity: 'Info',
    })
  },

  dispatchAssigned: (dispatchId: string, assignee: string) => {
    logAuditEvent({
      category: 'System',
      action: 'Dispatch assigned',
      target: dispatchId,
      details: `Assigned to: ${assignee}`,
      severity: 'Info',
    })
  },

  // Tariff events
  tariffCreated: (tariffId: string, tariffName: string) => {
    logAuditEvent({
      category: 'Billing',
      action: 'Tariff created',
      target: tariffId,
      details: `Created tariff: ${tariffName}`,
      severity: 'Info',
    })
  },

  tariffUpdated: (tariffId: string, changes: string) => {
    logAuditEvent({
      category: 'Billing',
      action: 'Tariff updated',
      target: tariffId,
      details: changes,
      severity: 'Info',
    })
  },

  tariffDeleted: (tariffId: string, tariffName: string) => {
    logAuditEvent({
      category: 'Billing',
      action: 'Tariff deleted',
      target: tariffId,
      details: `Deleted tariff: ${tariffName}`,
      severity: 'Warning',
    })
  },

  // Webhook events
  webhookCreated: (webhookId: string, url: string) => {
    logAuditEvent({
      category: 'Config',
      action: 'Webhook created',
      target: webhookId,
      details: `Webhook URL: ${url}`,
      severity: 'Info',
    })
  },

  webhookUpdated: (webhookId: string, changes: string) => {
    logAuditEvent({
      category: 'Config',
      action: 'Webhook updated',
      target: webhookId,
      details: changes,
      severity: 'Info',
    })
  },

  webhookDeleted: (webhookId: string) => {
    logAuditEvent({
      category: 'Config',
      action: 'Webhook deleted',
      target: webhookId,
      details: 'Webhook configuration deleted',
      severity: 'Warning',
    })
  },

  // Auth events
  login: (userId: string) => {
    logAuditEvent({
      category: 'Auth',
      action: 'User login',
      target: userId,
      details: 'User logged in',
      severity: 'Info',
    })
  },

  logout: (userId: string) => {
    logAuditEvent({
      category: 'Auth',
      action: 'User logout',
      target: userId,
      details: 'User logged out',
      severity: 'Info',
    })
  },

  passwordReset: (userId: string) => {
    logAuditEvent({
      category: 'Auth',
      action: 'Password reset',
      target: userId,
      details: 'Password reset initiated',
      severity: 'Warning',
    })
  },
}
