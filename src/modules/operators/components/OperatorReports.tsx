import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Operator Reports — Performance & Energy Reports
   RBAC: Operators, Platform admins
───────────────────────────────────────────────────────────────────────────── */

export function OperatorReports() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'reports', 'view')

  const [from, setFrom] = useState('2025-10-01')
  const [to, setTo] = useState('2025-10-31')
  const [site, setSite] = useState('All Sites')
  const [includeCharging, setIncludeCharging] = useState(true)
  const [includeSwapping, setIncludeSwapping] = useState(true)
  const [granularity, setGranularity] = useState('1d')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const metrics = useMemo(() => {
    const days = Math.max(1, (new Date(to).getTime() - new Date(from).getTime()) / 86400000)
    const sessions = includeCharging ? Math.round(380 * days / 28) : 0
    const swaps = includeSwapping ? Math.round(220 * days / 28) : 0
    const kwh = includeCharging ? Math.round(3200 * days / 28) : 0
    const revenue = (kwh * 0.25 + swaps * 2.5)
    return { sla: 98.6, uptime: 99.4, sessions, swaps, kwh, revenue }
  }, [from, to, includeCharging, includeSwapping])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Operator Reports.</div>
  }

  return (
    <DashboardLayout pageTitle="Operator — Reports">
      <div className="space-y-6">
        {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

        {/* Filters */}
        <section className="bg-surface rounded-xl border border-border p-4">
          <div className="grid md:grid-cols-6 gap-3">
            <label className="md:col-span-2 space-y-1">
              <span className="text-xs text-subtle">Date range</span>
              <div className="flex gap-2">
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="flex-1 rounded-lg border border-border px-3 py-2" />
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="flex-1 rounded-lg border border-border px-3 py-2" />
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-subtle">Site</span>
              <select value={site} onChange={e => setSite(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2">
                {['All Sites', 'Central Hub', 'Airport East', 'Tech Park A'].map(o => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-subtle">Granularity</span>
              <select value={granularity} onChange={e => setGranularity(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2">
                {[['15m', '15 min'], ['1h', 'Hourly'], ['1d', 'Daily'], ['1w', 'Weekly']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <div className="md:col-span-2 space-y-1">
              <span className="text-xs text-subtle">Include</span>
              <div className="flex items-center gap-4 text-sm mt-2">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={includeCharging} onChange={e => setIncludeCharging(e.target.checked)} className="rounded" />
                  Charging
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={includeSwapping} onChange={e => setIncludeSwapping(e.target.checked)} className="rounded" />
                  Swapping
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: 'SLA %', value: `${metrics.sla}%`, icon: '📊' },
            { label: 'Uptime', value: `${metrics.uptime}%`, icon: '⚡' },
            { label: 'Sessions', value: metrics.sessions.toLocaleString(), icon: '🔌' },
            { label: 'Swaps', value: metrics.swaps.toLocaleString(), icon: '🔄' },
            { label: 'kWh', value: metrics.kwh.toLocaleString(), icon: '⚡' },
            { label: 'Revenue', value: `$${metrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: '💰' },
          ].map(k => (
            <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{k.icon}</span>
                <div className="text-sm text-subtle">{k.label}</div>
              </div>
              <div className="text-2xl font-bold">{k.value}</div>
            </div>
          ))}
        </section>

        {/* Charts Placeholders */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18" /><rect x="7" y="8" width="3" height="8" /><rect x="12" y="5" width="3" height="11" /><rect x="17" y="11" width="3" height="5" /></svg>
              SLA Trend ({granularity})
            </h3>
            <div className="h-64 rounded-lg bg-muted border border-border grid place-items-center text-subtle">
              Line Chart • SLA %
            </div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 3c-7.5 0-12 4.5-12 12 0 3 0 6-3 6 0-6 4.5-12 12-12 3 0 6 0 6-3z" /></svg>
              Energy & Sessions ({granularity})
            </h3>
            <div className="h-64 rounded-lg bg-muted border border-border grid place-items-center text-subtle">
              Area Chart • kWh / Sessions
            </div>
          </div>
        </section>

        {/* SLA Breaches */}
        <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <h3 className="font-semibold mb-4">SLA Breaches</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-subtle">
                <tr>
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2 text-left font-medium">Site</th>
                <th className="px-4 py-2 text-left font-medium">Device</th>
                <th className="px-4 py-2 text-left font-medium">Target</th>
                <th className="px-4 py-2 text-left font-medium">Actual</th>
                <th className="px-4 py-2 text-left font-medium">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { date: '2025-10-28', site: 'Central Hub', device: 'CP-A1', target: '99.5%', actual: '98.2%', gap: '-1.3%' },
                { date: '2025-10-25', site: 'Airport East', device: 'CP-B4', target: '99.5%', actual: '99.1%', gap: '-0.4%' },
              ].map((b, i) => (
                <tr key={i} className="hover:bg-muted/50">
                  <td className="px-4 py-2">{b.date}</td>
                  <td className="px-4 py-2">{b.site}</td>
                  <td className="px-4 py-2">{b.device}</td>
                  <td className="px-4 py-2">{b.target}</td>
                  <td className="px-4 py-2">{b.actual}</td>
                  <td className="px-4 py-2 text-rose-600">{b.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Site Breakdown */}
      <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Site Breakdown</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Site</th>
                <th className="px-4 py-2 !text-right font-medium">Sessions</th>
                <th className="px-4 py-2 !text-right font-medium">Swaps</th>
                <th className="px-4 py-2 !text-right font-medium">kWh</th>
                <th className="px-4 py-2 !text-right font-medium">Uptime</th>
                <th className="px-4 py-2 !text-right font-medium">SLA</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { site: 'Central Hub', sessions: 142, swaps: 89, kwh: 1240, uptime: '99.7%', sla: '98.8%' },
                  { site: 'Airport East', sessions: 98, swaps: 56, kwh: 890, uptime: '99.1%', sla: '99.2%' },
                  { site: 'Tech Park A', sessions: 76, swaps: 43, kwh: 670, uptime: '99.5%', sla: '99.0%' },
                ].map((s, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="px-4 py-2 font-medium">{s.site}</td>
                    <td className="px-4 py-2 text-right">{s.sessions}</td>
                    <td className="px-4 py-2 text-right">{s.swaps}</td>
                    <td className="px-4 py-2 text-right">{s.kwh}</td>
                    <td className="px-4 py-2 text-right">{s.uptime}</td>
                    <td className="px-4 py-2 text-right">{s.sla}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Export & Schedule */}
        <section className="flex items-center justify-between rounded-xl bg-surface border border-border p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => toast('Exported CSV')} className="px-4 py-2 rounded-lg border border-border hover:bg-muted flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              Export CSV
            </button>
            <button onClick={() => toast('Generated PDF')} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">
              Export PDF
            </button>
          </div>
          <button onClick={() => toast('Schedule Report modal would open')} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            Schedule Report
          </button>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default OperatorReports

