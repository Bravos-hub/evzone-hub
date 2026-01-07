import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

/**
 * Webhooks Page - Admin feature
 */
export function Webhooks() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'webhooks')

  const mockWebhooks = [
    { id: 'WH-001', url: 'https://api.partner.com/events', events: ['session.started', 'session.ended'], status: 'Active', lastDelivery: '2m ago', successRate: 99.5 },
    { id: 'WH-002', url: 'https://billing.internal/hooks', events: ['payment.completed'], status: 'Active', lastDelivery: '15m ago', successRate: 100 },
    { id: 'WH-003', url: 'https://old-system.local/notify', events: ['station.offline'], status: 'Paused', lastDelivery: '3d ago', successRate: 85.2 },
  ]

  return (
    <DashboardLayout pageTitle="Webhooks">
      {/* Actions */}
      {perms.create && (
        <div className="mb-4">
          <button className="btn secondary" onClick={() => alert('Add webhook (demo)')}>
            + Add Webhook
          </button>
        </div>
      )}

      {/* Webhooks Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Events</th>
              <th>Status</th>
              <th>Last Delivery</th>
              <th>Success Rate</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockWebhooks.map((w) => (
              <tr key={w.id}>
                <td>
                  <div className="font-medium text-text truncate max-w-[200px]">{w.url}</div>
                  <div className="text-xs text-muted">{w.id}</div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {w.events.map((e) => <span key={e} className="chip text-xs">{e}</span>)}
                  </div>
                </td>
                <td>
                  <span className={`pill ${w.status === 'Active' ? 'approved' : 'pending'}`}>{w.status}</span>
                </td>
                <td className="text-sm">{w.lastDelivery}</td>
                <td>
                  <span className={w.successRate >= 99 ? 'text-ok' : w.successRate >= 90 ? 'text-warn' : 'text-danger'}>
                    {w.successRate}%
                  </span>
                </td>
                <td className="text-right">
                  <div className="inline-flex gap-2">
                    <button className="btn secondary" onClick={() => alert(`Test ${w.id} (demo)`)}>Test</button>
                    {perms.edit && (
                      <button className="btn secondary" onClick={() => alert(`Edit ${w.id} (demo)`)}>Edit</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Deliveries */}
      <div className="card mt-4">
        <h3 className="font-semibold text-text mb-3">Recent Deliveries</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>session.ended → api.partner.com</span>
            <span className="pill approved">200 OK</span>
            <span className="text-muted">2m ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span>payment.completed → billing.internal</span>
            <span className="pill approved">200 OK</span>
            <span className="text-muted">15m ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span>session.started → api.partner.com</span>
            <span className="pill rejected">500 Error</span>
            <span className="text-muted">1h ago</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

