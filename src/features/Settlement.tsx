import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useSettlements } from '@/modules/finance/settlements/useSettlements'
import { getErrorMessage } from '@/core/api/errors'
import { LoadingRow } from '@/ui/components/SkeletonCards'

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

export function Settlement() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'settlement')

  const { data: settlementsData = [], isLoading, error } = useSettlements()

  const [region, setRegion] = useState<'ALL' | string>('ALL')
  const [status, setStatus] = useState<SettlementStatus | 'All'>('All')

  const rows = useMemo(() => {
    const raw = Array.isArray(settlementsData) ? settlementsData : (settlementsData as any)?.data || []
    return raw
      .map((r: any) => ({
        id: r.id,
        region: r.region || r.country || '—',
        org: r.org || r.organizationName || r.organizationId || '—',
        type: r.type || 'Payout',
        amount: r.amount ?? r.netAmount ?? r.totalRevenue ?? 0,
        currency: r.currency || 'USD',
        status: r.status || 'Queued',
        startedAt: r.startedAt || r.createdAt || '—',
        finishedAt: r.finishedAt || r.payoutDate || undefined,
        note: r.note || r.description || '',
      }))
      .filter((r) => (region === 'ALL' ? true : r.region === region))
      .filter((r) => (status === 'All' ? true : r.status === status))
  }, [settlementsData, region, status])

  return (
    <DashboardLayout pageTitle="Settlement">
      <div className="space-y-4">
        {error && (
          <div className="card bg-red-50 border border-red-200">
            <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
          </div>
        )}
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
              {isLoading && <LoadingRow colSpan={10} />}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-muted">No settlements found.</td>
                </tr>
              )}
              {!isLoading && rows.map((r) => (
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

