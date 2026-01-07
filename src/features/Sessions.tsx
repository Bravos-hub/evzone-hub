import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useSessionHistory, useActiveSessions } from '@/core/api/hooks/useSessions'
import { getErrorMessage } from '@/core/api/errors'
import type { SessionStatus, PaymentMethod } from '@/core/types/domain'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type SessionRow = {
  id: string
  chargePointId: string
  connectorId: string
  site: string
  start: Date
  end?: Date
  status: SessionStatus
  energyKwh: number
  amount: number
  paymentMethod: PaymentMethod
  tariffName: string
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sessions Page - Unified for all roles
 * 
 * RBAC Controls:
 * - viewAll: ADMIN, OPERATOR see all sessions
 * - export: ADMIN, OPERATOR, OWNER can export
 * - refund: ADMIN, OPERATOR can issue refunds
 * - stopSession: ADMIN, OPERATOR, OWNER, STATION_ADMIN, ATTENDANT
 */
export function Sessions() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'sessions')
  
  const [site, setSite] = useState('All Sites')
  const [status, setStatus] = useState<SessionStatus | 'All'>('All')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'All'>('All')
  const [from, setFrom] = useState('2025-10-01')
  const [to, setTo] = useState('2025-10-29')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, boolean>>({})

  // Fetch session history
  const { data: historyData, isLoading, error } = useSessionHistory({
    page: 1,
    limit: 100,
    status: status !== 'All' ? status.toUpperCase() : undefined,
  })

  // Map API sessions to the format expected by the component
  const rows = useMemo<SessionRow[]>(() => {
    if (!historyData?.sessions) return []
    
    return historyData.sessions.map((session: any): SessionRow => ({
      id: session.id,
      chargePointId: session.stationId || session.chargePointId || 'N/A',
      connectorId: session.connectorId || 'N/A',
      site: session.station?.name || 'Unknown',
      start: new Date(session.startedAt),
      end: session.endedAt ? new Date(session.endedAt) : undefined,
      status: session.status === 'COMPLETED' ? 'Completed' : session.status === 'ACTIVE' ? 'Active' : 'Failed' as SessionStatus,
      energyKwh: session.energyDelivered || 0,
      amount: session.cost || 0,
      paymentMethod: 'Wallet' as PaymentMethod, // API doesn't provide payment method
      tariffName: session.tariff?.name || session.tariffName || 'Standard', // Default to 'Standard' if not provided
    }))
      .filter((r) => (site === 'All Sites' ? true : r.site === site))
      .filter((r) => (paymentMethod === 'All' ? true : r.paymentMethod === paymentMethod))
      .filter((r) => {
        const date = r.start
        return date >= new Date(from) && date <= new Date(to)
      })
      .filter((r) =>
        q
          ? (r.id + ' ' + r.chargePointId + ' ' + r.site).toLowerCase().includes(q.toLowerCase())
          : true
      )
  }, [historyData, site, status, paymentMethod, from, to, q])

  const duration = (start: Date, end?: Date) => {
    if (!end) return '—'
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
    return `${minutes} min`
  }

  // Summary stats
  const stats = {
    total: rows.length,
    completed: rows.filter(r => r.status === 'Completed').length,
    failed: rows.filter(r => r.status === 'Failed').length,
    pending: rows.filter(r => r.status === 'Pending').length,
    totalKwh: rows.reduce((acc, r) => acc + (r.energyKwh || 0), 0),
    totalRevenue: rows.reduce((acc, r) => acc + r.amount, 0),
  }

  const allSel = rows.length > 0 && rows.every((r) => sel[r.id])
  const someSel = rows.some((r) => sel[r.id])

  function toggleAll() {
    const next: Record<string, boolean> = {}
    const val = !allSel
    rows.forEach((r) => (next[r.id] = val))
    setSel(next)
  }

  function toggle(id: string) {
    setSel((s) => ({ ...s, [id]: !s[id] }))
  }

  async function bulkRefund() {
    const ids = rows.filter((r) => sel[r.id]).map((r) => r.id)
    await new Promise((r) => setTimeout(r, 400))
    alert(`Refund initiated for: ${ids.join(', ')} (demo)`)
    setSel({})
  }

  async function exportSessions() {
    alert('Exporting sessions... (demo)')
  }

  return (
    <DashboardLayout pageTitle="Sessions">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Sessions</div>
          <div className="text-xl font-bold text-text">{stats.total}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Completed</div>
          <div className="text-xl font-bold text-ok">{stats.completed}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Failed</div>
          <div className="text-xl font-bold text-danger">{stats.failed}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Pending</div>
          <div className="text-xl font-bold text-warn">{stats.pending}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Total Energy</div>
          <div className="text-xl font-bold text-text">{stats.totalKwh.toFixed(1)} kWh</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Total Revenue</div>
          <div className="text-xl font-bold text-accent">${stats.totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Session ID or Charger"
            className="input col-span-2 xl:col-span-1"
          />
          <select value={site} onChange={(e) => setSite(e.target.value)} className="select">
            <option>All Sites</option>
            <option>Central Hub</option>
            <option>Airport East</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as SessionStatus | 'All')} className="select">
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Pending">Pending</option>
          </select>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | 'All')} className="select">
            <option value="All">All Payment</option>
            <option value="Card">Card</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Roaming">Roaming</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
      </div>

      <div className="h-4" />

      {/* Actions */}
      <div className="flex items-center gap-2 mb-4">
        {perms.export && (
          <button className="btn secondary" onClick={exportSessions}>
            Export
          </button>
        )}
        {someSel && perms.refund && (
          <button className="btn secondary" onClick={bulkRefund}>
            Refund Selected
          </button>
        )}
      </div>

      {/* Sessions Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {perms.refund && (
                <th className="w-10">
                  <input type="checkbox" className="h-4 w-4" checked={allSel} onChange={toggleAll} />
                </th>
              )}
              <th className="w-20">Session</th>
              <th className="w-28">Site</th>
              <th className="w-28">Charger/Conn</th>
              <th className="w-28">Start</th>
              <th className="w-28">End</th>
              <th className="w-20">Duration</th>
              <th className="w-12 !text-right">kWh</th>
              <th className="w-20">Tariff</th>
              <th className="w-16 !text-right">Amount</th>
              <th className="w-20">Payment</th>
              <th className="w-20">Status</th>
              <th className="w-20 !text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {perms.refund && (
                  <td>
                    <input type="checkbox" className="h-4 w-4" checked={!!sel[r.id]} onChange={() => toggle(r.id)} />
                  </td>
                )}
                <td className="font-semibold truncate max-w-[80px]">
                  <a href={`/sessions/${r.id}`} className="text-accent hover:underline">
                    {r.id}
                  </a>
                </td>
                <td className="truncate max-w-[112px]" title={r.site}>{r.site}</td>
                <td className="truncate max-w-[112px]" title={`${r.chargePointId}/${r.connectorId}`}>
                  {r.chargePointId}/{r.connectorId}
                </td>
                <td className="whitespace-nowrap text-xs">{r.start.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="whitespace-nowrap text-xs">
                  {r.end
                    ? r.end.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </td>
                <td className="whitespace-nowrap text-xs">{duration(r.start, r.end)}</td>
                <td className="text-right whitespace-nowrap text-xs">{r.energyKwh?.toFixed(1) || '—'}</td>
                <td className="truncate max-w-[80px] text-xs" title={r.tariffName}>{r.tariffName}</td>
                <td className="text-right whitespace-nowrap text-xs">${r.amount.toFixed(2)}</td>
                <td className="truncate max-w-[80px] text-xs">{r.paymentMethod}</td>
                <td>
                  <span
                    className={`pill whitespace-nowrap ${
                      r.status === 'Completed'
                        ? 'approved'
                        : r.status === 'Failed'
                          ? 'rejected'
                          : r.status === 'Pending'
                            ? 'pending'
                            : 'sendback'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <a href={`/sessions/${r.id}`} className="px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors">
                      View
                    </a>
                    {perms.refund && r.status === 'Completed' && (
                      <button className="px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors" onClick={() => alert(`Refund ${r.id} (demo)`)}>
                        Refund
                      </button>
                    )}
                    {perms.stopSession && r.status === 'Pending' && (
                      <button className="px-2 py-1 text-xs rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors" onClick={() => alert(`Stop ${r.id} (demo)`)}>
                        Stop
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

