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

