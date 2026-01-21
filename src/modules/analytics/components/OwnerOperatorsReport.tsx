import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & ICONS
// ═══════════════════════════════════════════════════════════════════════════

type SLABreach = {
  date: string
  site: string
  incident: string
  duration: string
  rootCause: string
  resolved: string
}

type SiteMetric = {
  site: string
  value: string | number
}

const IconBolt = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>
)

const IconChart = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 3v18h18" />
    <rect x="7" y="8" width="3" height="8" />
    <rect x="12" y="5" width="3" height="11" />
    <rect x="17" y="11" width="3" height="5" />
  </svg>
)

const IconDownload = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
)

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Owner Operators Report - Owner feature
 * Shows operator performance metrics with KPIs, trends, SLA breaches, and site breakdowns
 */
export function OwnerOperatorsReport() {
  const { id } = useParams<{ id: string }>()
  const opId = id || 'op-101'
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'operators')

  const [site, setSite] = useState('All Sites')
  const [from, setFrom] = useState('2025-10-01')
  const [to, setTo] = useState('2025-10-28')
  const [slaTarget, setSlaTarget] = useState(99.0)

  const metrics = {
    sla: 98.4,
    uptime: 99.7,
    mttr: '42m',
    tickets: 184,
    response: '3h 52m',
  }

  const breaches: SLABreach[] = [
    { date: '2025-10-18', site: 'Central Hub', incident: 'Outage', duration: '32m', rootCause: 'Grid dip', resolved: 'Yes' },
    { date: '2025-10-12', site: 'Airport East', incident: 'Slow response', duration: '2h', rootCause: 'Backlog', resolved: 'Yes' },
  ]

  const sites = ['Central Hub', 'Airport East', 'Tech Park A']
  const uptimeBySite: SiteMetric[] = sites.map((s, i) => ({ site: s, value: (99.2 + i * 0.2).toFixed(1) + '%' }))
  const ticketsBySite: SiteMetric[] = sites.map((s, i) => ({ site: s, value: [92, 71, 41][i] }))
  const responseBySite: SiteMetric[] = sites.map((s, i) => ({ site: s, value: ['3h 10m', '4h 02m', '3h 55m'][i] }))

  function exportCsv(kind: 'report' | 'breaches') {
    if (kind === 'report') {
      const header = ['Metric', 'Value'].join(',')
      const lines = [
        ['SLA', `${metrics.sla}%`],
        ['Uptime', `${metrics.uptime}%`],
        ['MTTR', metrics.mttr],
        ['Tickets Resolved', metrics.tickets],
        ['Avg Response', metrics.response],
      ].map((r) => r.join(','))
      const csv = [header, ...lines].join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `operator-report-${opId}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } else {
      const header = ['Date', 'Site', 'Incident', 'Duration', 'Root Cause', 'Resolved'].join(',')
      const lines = breaches.map((b) => [b.date, b.site, b.incident, b.duration, b.rootCause, b.resolved].join(','))
      const csv = [header, ...lines].join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `sla-breaches-${opId}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  }

  function exportPdf() {
    alert('PDF export (demo)')
  }

  if (!perms.view) {
    return (
      <DashboardLayout pageTitle="Operator Report">
        <Card>
          <p className="text-muted">You don't have permission to view this page.</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={`Operator Report — ${opId}`}>
      {/* Header actions */}
      <div className="mb-4 flex items-center justify-between">
        <Link to="/owner-operators" className="btn secondary">
          Back to Operators
        </Link>
        <div className="flex items-center gap-2">
          <button className="btn secondary" onClick={() => exportCsv('report')}>
            <IconDownload /> CSV
          </button>
          <button className="btn secondary" onClick={exportPdf}>
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid md:grid-cols-5 gap-2">
          <label className="grid gap-1 md:col-span-2">
            <span className="text-xs text-muted">Site</span>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="select"
            >
              {['All Sites', 'Central Hub', 'Airport East', 'Tech Park A'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted">SLA target (%)</span>
            <input
              type="number"
              min="90"
              max="100"
              step="0.1"
              value={slaTarget}
              onChange={(e) => setSlaTarget(parseFloat(e.target.value) || 99.0)}
              className="input"
            />
          </label>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiCard label="SLA" value={`${metrics.sla}%`} note={`Target ${slaTarget}%`} />
        <KpiCard label="Uptime" value={`${metrics.uptime}%`} />
        <KpiCard label="MTTR" value={metrics.mttr} />
        <KpiCard label="Tickets resolved" value={`${metrics.tickets}`} />
        <KpiCard label="Avg response" value={metrics.response} />
      </div>

      {/* Trends */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <div className="flex items-center gap-2 text-muted mb-2">
            <IconChart /> <h3 className="font-semibold">SLA over time (placeholder)</h3>
          </div>
          <div className="h-56 rounded-xl bg-surface-alt border border-border grid place-items-center text-muted">
            Area Chart • SLA % by day
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-muted mb-2">
            <IconChart /> <h3 className="font-semibold">Tickets & MTTR (placeholder)</h3>
          </div>
          <div className="h-56 rounded-xl bg-surface-alt border border-border grid place-items-center text-muted">
            Bar/Line • Tickets & MTTR
          </div>
        </Card>
      </div>

      {/* SLA Breaches */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">SLA breaches</h3>
          <button className="btn secondary" onClick={() => exportCsv('breaches')}>
            <IconDownload /> CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-muted">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Site</th>
                <th className="px-4 py-2 text-left">Incident</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">Root cause</th>
                <th className="px-4 py-2 text-left">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {breaches.map((b, idx) => (
                <tr key={idx} className="hover:bg-surface-alt">
                  <td className="px-4 py-2 whitespace-nowrap">{b.date}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{b.site}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{b.incident}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{b.duration}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{b.rootCause}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{b.resolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sites breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <h4 className="font-semibold mb-3">Top sites by uptime</h4>
          <ul className="text-sm space-y-1">
            {uptimeBySite.map((s, i) => (
              <li key={s.site} className="flex justify-between">
                <span>
                  {i + 1}. {s.site}
                </span>
                <span className="font-medium">{s.value}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h4 className="font-semibold mb-3">Tickets resolved (30d)</h4>
          <ul className="text-sm space-y-1">
            {ticketsBySite.map((s) => (
              <li key={s.site} className="flex justify-between">
                <span>{s.site}</span>
                <span className="font-medium">{s.value}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h4 className="font-semibold mb-3">Avg response</h4>
          <ul className="text-sm space-y-1">
            {responseBySite.map((s) => (
              <li key={s.site} className="flex justify-between">
                <span>{s.site}</span>
                <span className="font-medium">{s.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function KpiCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card>
      <div className="text-sm text-muted mb-1">{label}</div>
      <div className="text-2xl font-bold text-text">{value}</div>
      {note && <div className="text-xs text-muted mt-1">{note}</div>}
    </Card>
  )
}

