import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useWebhookDeliveries, useReplayWebhookDelivery } from '@/modules/integrations/useWebhooks'
import { getErrorMessage } from '@/core/api/errors'
import { LoadingRow } from '@/ui/components/SkeletonCards'

type DeliveryStatus = 'Delivered' | 'Failed' | 'Retrying'

type Delivery = {
  id: string
  endpoint: string
  event: string
  status: DeliveryStatus
  code: number
  ts: string
}

export function WebhooksLog() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'webhooksLog')

  const [status, setStatus] = useState<DeliveryStatus | 'All'>('All')
  const [q, setQ] = useState('')
  const { data: deliveries = [], isLoading, error } = useWebhookDeliveries()
  const replayMutation = useReplayWebhookDelivery()

  const mappedDeliveries = useMemo<Delivery[]>(() => {
    return deliveries.map((d: any) => {
      const statusValue = (d.status || '').toString().toLowerCase()
      const mappedStatus: DeliveryStatus =
        statusValue === 'delivered' || statusValue === 'success'
          ? 'Delivered'
          : statusValue === 'retrying' || statusValue === 'pending'
            ? 'Retrying'
            : 'Failed'

      const created = new Date(d.createdAt || d.timestamp || d.ts || Date.now())
      const ts = Number.isFinite(created.getTime()) ? created.toLocaleString() : '—'

      return {
        id: d.id,
        endpoint: d.endpoint || d.url || d.targetUrl || '—',
        event: d.event || d.eventType || d.topic || '—',
        status: mappedStatus,
        code: d.statusCode ?? d.code ?? 0,
        ts,
      }
    })
  }, [deliveries])

  const rows = useMemo(() => {
    return mappedDeliveries
      .filter((d) => (status === 'All' ? true : d.status === status))
      .filter((d) => (q ? (d.endpoint + ' ' + d.event).toLowerCase().includes(q.toLowerCase()) : true))
  }, [mappedDeliveries, status, q])

  return (
    <DashboardLayout pageTitle="Webhooks Log">
      <div className="space-y-4">
        {error && (
          <div className="card bg-red-50 border border-red-200">
            <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
          </div>
        )}
        <div className="card grid md:grid-cols-3 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search endpoint or event" className="input" />
          <select value={status} onChange={(e) => setStatus(e.target.value as DeliveryStatus | 'All')} className="select">
            {['All', 'Delivered', 'Failed', 'Retrying'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Code</th>
                <th>When</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <LoadingRow colSpan={6} />}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">No deliveries found.</td>
                </tr>
              )}
              {!isLoading && rows.map((d) => (
                <tr key={d.id}>
                  <td className="font-semibold">{d.event}</td>
                  <td className="text-sm text-muted">{d.endpoint}</td>
                  <td>
                    <span
                      className={`pill ${
                        d.status === 'Delivered'
                          ? 'approved'
                          : d.status === 'Retrying'
                          ? 'pending'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td>{d.code}</td>
                  <td>{d.ts}</td>
                  <td className="text-right">
                    {perms.replay && (
                      <button
                        className="btn secondary"
                        onClick={() =>
                          replayMutation.mutate(d.id, {
                            onSuccess: () => alert('Replay queued'),
                            onError: (err) => alert(getErrorMessage(err)),
                          })
                        }
                      >
                        Replay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

