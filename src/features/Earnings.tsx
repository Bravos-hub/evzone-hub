import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

/**
 * Earnings Page - Owner/Site Owner feature
 */
export function Earnings() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'earnings')

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')

  const stats = {
    total: 24560.00,
    pending: 3420.00,
    paid: 21140.00,
    sessions: 1842,
  }

  const recentPayouts = [
    { id: 'PAY-001', date: '2024-12-15', amount: 8420.00, status: 'Paid' },
    { id: 'PAY-002', date: '2024-11-15', amount: 7890.00, status: 'Paid' },
    { id: 'PAY-003', date: '2024-10-15', amount: 4830.00, status: 'Paid' },
  ]

  return (
    <DashboardLayout pageTitle="Earnings">
      {/* Period Selector */}
      <div className="flex gap-2 mb-4">
        {(['day', 'week', 'month', 'year'] as const).map((p) => (
          <button
            key={p}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${period === p ? 'bg-accent text-white' : 'bg-panel border border-border-light text-muted hover:text-text'}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card">
          <div className="text-xs text-muted">Total Earnings</div>
          <div className="text-xl font-bold text-text">${stats.total.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Pending Payout</div>
          <div className="text-xl font-bold text-warn">${stats.pending.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Paid Out</div>
          <div className="text-xl font-bold text-ok">${stats.paid.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Sessions</div>
          <div className="text-xl font-bold text-accent">{stats.sessions.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payouts */}
        <div className="card">
          <h3 className="font-semibold text-text mb-3">Recent Payouts</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Payout</th>
                  <th>Date</th>
                  <th className="!text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayouts.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.id}</td>
                    <td className="text-sm">{p.date}</td>
                    <td className="text-right font-semibold">${p.amount.toLocaleString()}</td>
                    <td><span className="pill approved">{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown */}
        <div className="card">
          <h3 className="font-semibold text-text mb-3">Earnings Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Charging Revenue</span>
              <span className="font-semibold">$18,450.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Swap Revenue</span>
              <span className="font-semibold">$5,210.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Parking Fees</span>
              <span className="font-semibold">$900.00</span>
            </div>
            <div className="border-t border-border-light pt-3 flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>${stats.total.toLocaleString()}</span>
            </div>
          </div>
          {perms.export && (
            <button className="btn secondary mt-4" onClick={() => alert('Export earnings (demo)')}>
              Export
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

