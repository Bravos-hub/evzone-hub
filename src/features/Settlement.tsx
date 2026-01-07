import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type SettlementStatus = 'Queued' | 'Running' | 'Completed' | 'Failed'

type SettlementItem = {
  id: string
  region: string
  org: string
  type: 'Payout' | 'Reconciliation' | 'Disputes'
  amount: number
  currency: string
  status: SettlementStatus
  startedAt: string
  finishedAt?: string
  note?: string
}

const mockSettlements: SettlementItem[] = [
  { id: 'SET-001', region: 'EUROPE', org: 'GridManaged', type: 'Payout', amount: 89210, currency: 'USD', status: 'Running', startedAt: '2025-12-28 09:20', note: 'Batch EU-221' },
  { id: 'SET-002', region: 'AFRICA', org: 'VoltOps Ltd', type: 'Reconciliation', amount: 18240, currency: 'USD', status: 'Queued', startedAt: '2025-12-28 09:10' },
  { id: 'SET-003', region: 'AMERICAS', org: 'Central Park Owners Co', type: 'Disputes', amount: 4210, currency: 'USD', status: 'Completed', startedAt: '2025-12-27 18:00', finishedAt: '2025-12-27 19:05' },
]

export function Settlement() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'settlement')

  const [region, setRegion] = useState<'ALL' | string>('ALL')
  const [status, setStatus] = useState<SettlementStatus | 'All'>('All')

  const rows = useMemo(() => {
    return mockSettlements
      .filter((r) => (region === 'ALL' ? true : r.region === region))
      .filter((r) => (status === 'All' ? true : r.status === status))
  }, [region, status])

  return (
    <DashboardLayout pageTitle="Settlement">
      <div className="space-y-4">
        {/* Filters */}
        <div className="card grid md:grid-cols-4 gap-3">
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="select">
            {['ALL', 'AFRICA', 'EUROPE', 'AMERICAS', 'ASIA', 'MIDDLE_EAST'].map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All regions' : r}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as SettlementStatus | 'All')} className="select">
            {['All', 'Queued', 'Running', 'Completed', 'Failed'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="btn secondary" onClick={() => alert('Run settlement (mock)')}>
            Run settlement
          </button>
          {perms.export && (
            <button className="btn secondary" onClick={() => alert('Export ledger (mock)')}>
              Export ledger
            </button>
          )}
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Region</th>
                <th>Org</th>
                <th>Type</th>
                <th className="!text-right">Amount</th>
                <th>Status</th>
                <th>Started</th>
                <th>Finished</th>
                <th>Note</th>
                <th className="!text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.id}</td>
                  <td>{r.region}</td>
                  <td>{r.org}</td>
                  <td>{r.type}</td>
                  <td className="text-right">${r.amount.toLocaleString()}</td>
                  <td>
                    <span
                      className={`pill ${
                        r.status === 'Completed'
                          ? 'approved'
                          : r.status === 'Running'
                          ? 'pending'
                          : r.status === 'Queued'
                          ? 'bg-muted/30 text-muted'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>{r.startedAt}</td>
                  <td>{r.finishedAt || '—'}</td>
                  <td className="text-sm text-muted">{r.note || '—'}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      {perms.resolve && (
                        <button className="btn secondary" onClick={() => alert('Mark resolved (mock)')}>
                          Mark resolved
                        </button>
                      )}
                      {perms.export && (
                        <button className="btn secondary" onClick={() => alert('Export (mock)')}>
                          Export
                        </button>
                      )}
                    </div>
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

