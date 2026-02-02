import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { getPermissionsForFeature } from '@/constants/permissions'
import { PATHS } from '@/app/router/paths'
import { useWalletBalance, useWalletTransactions } from '@/modules/finance/wallet/useWallet'
import { useWithdrawalHistory } from '@/modules/finance/withdrawals/useWithdrawals'
import { useSessionStats } from '@/modules/sessions/hooks/useSessions'
import { analyticsService } from '@/modules/analytics/services/analyticsService'
import { getErrorMessage } from '@/core/api/errors'
import type { WalletTransaction, WithdrawalTransaction } from '@/core/api/types'
import { StatGridSkeleton, TableSkeleton, TextSkeleton } from '@/ui/components/SkeletonCards'

const PERIOD_DAYS: Record<'day' | 'week' | 'month' | 'year', number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
}

const statusPill = (status?: string) => {
  const v = String(status || '').toLowerCase()
  if (v.includes('complete') || v.includes('paid')) return 'approved'
  if (v.includes('pending')) return 'pending'
  if (v.includes('process')) return 'sendback'
  if (v.includes('fail')) return 'rejected'
  return 'bg-muted/20 text-muted'
}

const formatDate = (value?: string) => {
  if (!value) return '--'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '--'
  return date.toISOString().slice(0, 10)
}

const formatMoney = (currency: string, value: number) => {
  const amt = Number.isFinite(value) ? value : 0
  return `${currency} ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const classifyRevenue = (tx: WalletTransaction) => {
  const text = `${tx.description || ''} ${tx.reference || ''}`.toLowerCase()
  if (text.includes('swap')) return 'swap'
  if (text.includes('parking')) return 'parking'
  if (text.includes('charge') || text.includes('session')) return 'charging'
  return 'other'
}

/**
 * Earnings Page - Owner/Site Owner feature
 */
export function Earnings() {
  const { user } = useAuthStore()
  const { data: me } = useMe()
  const navigate = useNavigate()
  const perms = getPermissionsForFeature(user?.role, 'earnings')
  const isSiteOwner = user?.role === 'SITE_OWNER'

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')
  const [ack, setAck] = useState('')

  const { data: balance, isLoading: balanceLoading, error: balanceError } = useWalletBalance()
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError } = useWalletTransactions()
  const { data: withdrawalsData, isLoading: withdrawalsLoading, error: withdrawalsError } = useWithdrawalHistory()
  const { data: sessionStats, isLoading: sessionsLoading, error: sessionsError } = useSessionStats()

  const transactions = useMemo<WalletTransaction[]>(() => {
    if (Array.isArray(transactionsData)) return transactionsData
    return (transactionsData as any)?.data || []
  }, [transactionsData])

  const withdrawals = useMemo<WithdrawalTransaction[]>(() => {
    if (Array.isArray(withdrawalsData)) return withdrawalsData
    return (withdrawalsData as any)?.data || []
  }, [withdrawalsData])

  const currency = balance?.currency || withdrawals[0]?.currency || 'USD'

  const cutoff = useMemo(() => {
    const days = PERIOD_DAYS[period]
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date
  }, [period])

  const periodTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const date = new Date(tx.createdAt)
      return Number.isFinite(date.getTime()) && date >= cutoff
    })
  }, [transactions, cutoff])

  const periodWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      const date = new Date(w.createdAt)
      return Number.isFinite(date.getTime()) && date >= cutoff
    })
  }, [withdrawals, cutoff])

  const earningsTotal = useMemo(() => {
    return periodTransactions
      .filter((tx) => String(tx.type).toUpperCase() === 'CREDIT')
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0)
  }, [periodTransactions])

  const pendingTotal = useMemo(() => {
    return periodWithdrawals
      .filter((w) => ['pending', 'processing'].includes(String(w.status || '').toLowerCase()))
      .reduce((sum, w) => sum + Math.abs(Number(w.amount || 0)), 0)
  }, [periodWithdrawals])

  const paidTotal = useMemo(() => {
    return periodWithdrawals
      .filter((w) => String(w.status || '').toLowerCase() === 'completed')
      .reduce((sum, w) => sum + Math.abs(Number(w.amount || 0)), 0)
  }, [periodWithdrawals])

  const sessionsCount = useMemo(() => {
    const raw = sessionStats as any
    const count = raw?.totalSessions ?? raw?.sessions ?? raw?.total ?? raw?.count ?? 0
    return Number.isFinite(Number(count)) ? Number(count) : 0
  }, [sessionStats])

  const breakdown = useMemo(() => {
    const buckets = { charging: 0, swap: 0, parking: 0, other: 0 }
    periodTransactions.forEach((tx) => {
      if (String(tx.type).toUpperCase() !== 'CREDIT') return
      const bucket = classifyRevenue(tx)
      buckets[bucket] += Math.abs(Number(tx.amount || 0))
    })
    return buckets
  }, [periodTransactions])

  const recentPayouts = useMemo(() => {
    return [...withdrawals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [withdrawals])

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const handleExport = async () => {
    try {
      const start = cutoff.toISOString().slice(0, 10)
      const end = new Date().toISOString().slice(0, 10)
      const orgId = me?.orgId || me?.organizationId
      const blob = await analyticsService.exportData('revenue', 'csv', start, end, orgId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `earnings_${start}_${end}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast(getErrorMessage(err))
    }
  }

  const isLoading = balanceLoading || transactionsLoading || withdrawalsLoading || sessionsLoading
  const error = balanceError || transactionsError || withdrawalsError || sessionsError

  return (
    <DashboardLayout pageTitle="Earnings">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm mb-4">{ack}</div>}
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {getErrorMessage(error)}
        </div>
      )}

      {/* Header with Period Selector and Withdraw Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
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
        {isSiteOwner && (
          <button
            onClick={() => navigate(PATHS.SITE_OWNER.WITHDRAWALS)}
            className="btn"
          >
            Withdraw Funds
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card">
          <div className="text-xs text-muted">Total Earnings</div>
          <div className="text-xl font-bold text-text">{formatMoney(currency, earningsTotal)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Pending Payout</div>
          <div className="text-xl font-bold text-warn">{formatMoney(currency, pendingTotal)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Paid Out</div>
          <div className="text-xl font-bold text-ok">{formatMoney(currency, paidTotal)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Sessions</div>
          <div className="text-xl font-bold text-accent">{sessionsCount.toLocaleString()}</div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <StatGridSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <TableSkeleton rows={4} cols={4} />
            </div>
            <div className="card">
              <TextSkeleton lines={4} />
            </div>
          </div>
        </div>
      )}

      {!isLoading && (
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
                      <td className="font-medium">{p.reference || p.id}</td>
                      <td className="text-sm">{formatDate(p.completedAt || p.createdAt)}</td>
                      <td className="text-right font-semibold">{formatMoney(p.currency || currency, Number(p.amount || 0))}</td>
                      <td><span className={`pill ${statusPill(p.status)}`}>{p.status}</span></td>
                    </tr>
                  ))}
                  {recentPayouts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-6">No payouts found</td>
                    </tr>
                  )}
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
                <span className="font-semibold">{formatMoney(currency, breakdown.charging)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Swap Revenue</span>
                <span className="font-semibold">{formatMoney(currency, breakdown.swap)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Parking Fees</span>
                <span className="font-semibold">{formatMoney(currency, breakdown.parking)}</span>
              </div>
              {breakdown.other > 0 && (
                <div className="flex items-center justify-between">
                  <span>Other</span>
                  <span className="font-semibold">{formatMoney(currency, breakdown.other)}</span>
                </div>
              )}
              <div className="border-t border-border-light pt-3 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatMoney(currency, earningsTotal)}</span>
              </div>
            </div>
            {perms.export && (
              <button className="btn secondary mt-4" onClick={handleExport}>
                Export
              </button>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Earnings
