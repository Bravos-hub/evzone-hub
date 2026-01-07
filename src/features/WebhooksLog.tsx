import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type DeliveryStatus = 'Delivered' | 'Failed' | 'Retrying'

type Delivery = {
  id: string
  endpoint: string
  event: string
  status: DeliveryStatus
  code: number
  ts: string
}

const mockDeliveries: Delivery[] = [
  { id: 'WH-001', endpoint: 'https://api.partner.com/events', event: 'session.ended', status: 'Delivered', code: 200, ts: '2m ago' },
  { id: 'WH-002', endpoint: 'https://billing.internal/hooks', event: 'payment.completed', status: 'Delivered', code: 200, ts: '15m ago' },
  { id: 'WH-003', endpoint: 'https://old-system.local/notify', event: 'station.offline', status: 'Failed', code: 500, ts: '1h ago' },
]

export function WebhooksLog() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'webhooksLog')

  const [status, setStatus] = useState<DeliveryStatus | 'All'>('All')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return mockDeliveries
      .filter((d) => (status === 'All' ? true : d.status === status))
      .filter((d) => (q ? (d.endpoint + ' ' + d.event).toLowerCase().includes(q.toLowerCase()) : true))
  }, [status, q])

  return (
    <DashboardLayout pageTitle="Webhooks Log">
      <div className="space-y-4">
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
              {rows.map((d) => (
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
                      <button className="btn secondary" onClick={() => alert('Replay (mock)')}>
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

