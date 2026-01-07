import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useTestWebhook } from '@/core/api/hooks/useWebhooks'
import { getErrorMessage } from '@/core/api/errors'
import { auditLogger } from '@/core/utils/auditLogger'

/**
 * Webhooks Page - Admin feature
 */
export function Webhooks() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'webhooks')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null)

  const { data: webhooksData, isLoading, error } = useWebhooks()
  const createWebhookMutation = useCreateWebhook()
  const updateWebhookMutation = useUpdateWebhook()
  const deleteWebhookMutation = useDeleteWebhook()
  const testWebhookMutation = useTestWebhook()

  // Map API webhooks to display format
  const webhooks = webhooksData?.map(w => ({
    id: w.id,
    url: w.url,
    events: w.events,
    status: w.status,
    lastDelivery: w.lastTrigger ? `${Math.round((Date.now() - w.lastTrigger.getTime()) / 60000)}m ago` : 'Never',
    successRate: 100 - (w.failureCount || 0) * 5, // Mock calculation
  })) || []

  return (
    <DashboardLayout pageTitle="Webhooks">
      {/* Error Message */}
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card mb-4">
          <div className="text-center py-8 text-muted">Loading webhooks...</div>
        </div>
      )}

      {/* Actions */}
      {perms.create && (
        <div className="mb-4">
          <button className="btn secondary" onClick={() => setShowCreateModal(true)}>
            + Add Webhook
          </button>
        </div>
      )}

      {/* Webhooks Table */}
      {!isLoading && (
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
            {webhooks.map((w) => (
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
                    <button 
                      className="btn secondary" 
                      onClick={async () => {
                        try {
                          const result = await testWebhookMutation.mutateAsync(w.id)
                          alert(`Test result: ${result.success ? 'Success' : 'Failed'}`)
                        } catch (err) {
                          alert(`Test failed: ${getErrorMessage(err)}`)
                        }
                      }}
                    >
                      Test
                    </button>
                    {perms.edit && (
                      <button className="btn secondary" onClick={() => setEditingWebhook(w.id)}>Edit</button>
                    )}
                    {perms.edit && (
                      <button 
                        className="btn danger" 
                        onClick={async () => {
                          if (window.confirm(`Delete webhook ${w.id}?`)) {
                            try {
                              await deleteWebhookMutation.mutateAsync(w.id)
                              auditLogger.webhookDeleted(w.id)
                            } catch (err) {
                              alert(`Failed to delete webhook: ${getErrorMessage(err)}`)
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Create/Edit Webhook Modal */}
      {(showCreateModal || editingWebhook) && (
        <WebhookModal
          webhook={editingWebhook ? webhooksData?.find(w => w.id === editingWebhook) : null}
          onClose={() => {
            setShowCreateModal(false)
            setEditingWebhook(null)
          }}
          onSubmit={async (data) => {
            try {
              if (editingWebhook) {
                await updateWebhookMutation.mutateAsync({
                  id: editingWebhook,
                  data: {
                    name: data.name,
                    url: data.url,
                    events: data.events,
                    status: data.status,
                  },
                })
                auditLogger.webhookUpdated(editingWebhook, `Updated webhook: ${data.name}`)
              } else {
                await createWebhookMutation.mutateAsync({
                  name: data.name,
                  url: data.url,
                  events: data.events,
                })
                auditLogger.webhookCreated('new', data.url)
              }
              setShowCreateModal(false)
              setEditingWebhook(null)
            } catch (err) {
              alert(`Failed to ${editingWebhook ? 'update' : 'create'} webhook: ${getErrorMessage(err)}`)
            }
          }}
        />
      )}

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

// Webhook Modal Component
function WebhookModal({ 
  webhook, 
  onClose, 
  onSubmit 
}: { 
  webhook?: any
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}) {
  const [form, setForm] = useState({
    name: webhook?.name || '',
    url: webhook?.url || '',
    events: webhook?.events || [] as string[],
    status: webhook?.status || 'Active' as 'Active' | 'Disabled',
  })

  const availableEvents = [
    'session.started',
    'session.completed',
    'session.failed',
    'booking.created',
    'booking.cancelled',
    'station.status',
    'incident.created',
    'payment.completed',
    'chargepoint.faulted',
  ]

  const toggleEvent = (event: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) 
        ? f.events.filter(e => e !== event)
        : [...f.events, event]
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-panel border-l border-border-light shadow-xl p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text">{webhook ? 'Edit Webhook' : 'Create New Webhook'}</h3>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault()
          await onSubmit(form)
        }} className="space-y-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Name *</span>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input"
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">URL *</span>
            <input
              type="url"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              className="input"
              placeholder="https://example.com/webhook"
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Events *</span>
            <div className="flex flex-wrap gap-2 p-3 border border-border-light rounded-lg min-h-[100px]">
              {availableEvents.map(event => (
                <button
                  key={event}
                  type="button"
                  onClick={() => toggleEvent(event)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    form.events.includes(event)
                      ? 'bg-accent text-white'
                      : 'bg-panel text-text-secondary hover:bg-panel-2'
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted">Select events to subscribe to</span>
          </label>
          {webhook && (
            <label className="grid gap-1">
              <span className="text-sm font-medium">Status</span>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as 'Active' | 'Disabled' }))}
                className="select"
              >
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </label>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn flex-1">{webhook ? 'Update' : 'Create'} Webhook</button>
          </div>
        </form>
      </div>
    </div>
  )
}
