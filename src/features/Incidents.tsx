import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Region = 'AFRICA' | 'EUROPE' | 'AMERICAS' | 'ASIA' | 'MIDDLE_EAST' | 'ALL'
type Severity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4'
type IncidentStatus = 'Investigating' | 'Identified' | 'Mitigating' | 'Monitoring' | 'Resolved'
type Impact = 'Charging' | 'Swapping' | 'Payments' | 'Auth' | 'Fleet' | 'Other'

type Incident = {
  id: string
  title: string
  status: IncidentStatus
  severity: Severity
  impact: Impact
  region: Region
  org: string
  commander: string
  createdAt: string
  updatedAt: string
  summary: string
  affectedStationsCount: number
  eta: string
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const regions: Array<{ id: Region; label: string }> = [
  { id: 'ALL', label: 'All Regions' },
  { id: 'AFRICA', label: 'Africa' },
  { id: 'EUROPE', label: 'Europe' },
  { id: 'AMERICAS', label: 'Americas' },
  { id: 'ASIA', label: 'Asia' },
  { id: 'MIDDLE_EAST', label: 'Middle East' },
]

const severities: Array<Severity | 'All'> = ['All', 'SEV1', 'SEV2', 'SEV3', 'SEV4']
const statuses: Array<IncidentStatus | 'All'> = ['All', 'Investigating', 'Identified', 'Mitigating', 'Monitoring', 'Resolved']
const impacts: Array<Impact | 'All'> = ['All', 'Charging', 'Swapping', 'Payments', 'Auth', 'Fleet', 'Other']

const mockIncidents: Incident[] = [
  {
    id: 'INC-2401',
    title: 'Mobile money confirmations delayed',
    status: 'Investigating',
    severity: 'SEV1',
    impact: 'Payments',
    region: 'AFRICA',
    org: '—',
    commander: 'SRE Oncall',
    createdAt: '2025-12-24 09:25',
    updatedAt: '2025-12-24 09:42',
    summary: 'Spike in top-ups not reflecting. Suspected payment webhook delays.',
    affectedStationsCount: 0,
    eta: 'Unknown',
  },
  {
    id: 'INC-2392',
    title: 'Charging sessions stuck at starting',
    status: 'Mitigating',
    severity: 'SEV2',
    impact: 'Charging',
    region: 'AFRICA',
    org: 'Volt Mobility',
    commander: 'Operator EA',
    createdAt: '2025-12-20 10:30',
    updatedAt: '2025-12-24 08:59',
    summary: 'Partial outage affecting session state transitions.',
    affectedStationsCount: 3,
    eta: '2h',
  },
  {
    id: 'INC-2384',
    title: 'Swap bay door unlock failures',
    status: 'Monitoring',
    severity: 'SEV2',
    impact: 'Swapping',
    region: 'AFRICA',
    org: 'Volt Mobility',
    commander: 'Support L2',
    createdAt: '2025-12-18 16:10',
    updatedAt: '2025-12-23 20:05',
    summary: 'Vendor patch applied. Monitoring recurrence.',
    affectedStationsCount: 1,
    eta: '4h',
  },
  {
    id: 'INC-2350',
    title: 'OCPP heartbeat timeouts Berlin',
    status: 'Resolved',
    severity: 'SEV3',
    impact: 'Charging',
    region: 'EUROPE',
    org: 'Mall Holdings',
    commander: 'SRE Oncall',
    createdAt: '2025-12-15 14:20',
    updatedAt: '2025-12-16 09:00',
    summary: 'Network configuration issue resolved.',
    affectedStationsCount: 5,
    eta: '—',
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Incidents Page - Unified for all roles
 * 
 * RBAC Controls:
 * - viewAll: ADMIN, OPERATOR see all incidents
 * - create: ADMIN, OPERATOR, station staff can create
 * - assign: ADMIN, OPERATOR can assign commanders
 * - resolve: ADMIN, OPERATOR, MANAGER, TECHNICIANS can resolve
 * - escalate: ADMIN, OPERATOR can escalate
 */
export function Incidents() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'incidents')

  const [rows, setRows] = useState<Incident[]>([])
  const [q, setQ] = useState('')
  const [region, setRegion] = useState<Region>('ALL')
  const [severity, setSeverity] = useState<Severity | 'All'>('All')
  const [status, setStatus] = useState<IncidentStatus | 'All'>('All')
  const [impact, setImpact] = useState<Impact | 'All'>('All')
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    // In real app, filter by user's access level
    setRows(mockIncidents)
  }, [])

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => (q ? (r.id + ' ' + r.title + ' ' + r.summary).toLowerCase().includes(q.toLowerCase()) : true))
        .filter((r) => (region === 'ALL' ? true : r.region === region))
        .filter((r) => (severity === 'All' ? true : r.severity === severity))
        .filter((r) => (status === 'All' ? true : r.status === status))
        .filter((r) => (impact === 'All' ? true : r.impact === impact)),
    [rows, q, region, severity, status, impact]
  )

  const summary = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((r) => r.status !== 'Resolved').length,
    sev1: filtered.filter((r) => r.severity === 'SEV1').length,
    sev2: filtered.filter((r) => r.severity === 'SEV2').length,
  }), [filtered])

  const openRow = rows.find((r) => r.id === openId) || null

  function sevColor(sev: Severity) {
    return sev === 'SEV1' ? 'bg-danger text-white' : sev === 'SEV2' ? 'bg-warn text-white' : 'bg-muted/30 text-muted'
  }

  function statusColor(s: IncidentStatus) {
    switch (s) {
      case 'Investigating': return 'bg-danger/20 text-danger'
      case 'Identified': return 'bg-warn/20 text-warn'
      case 'Mitigating': return 'bg-accent/20 text-accent'
      case 'Monitoring': return 'bg-ok/20 text-ok'
      case 'Resolved': return 'bg-muted/20 text-muted'
    }
  }

  return (
    <DashboardLayout pageTitle="Incidents">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Incidents</div>
          <div className="text-xl font-bold text-text">{summary.total}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Active</div>
          <div className="text-xl font-bold text-warn">{summary.active}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">SEV1</div>
          <div className="text-xl font-bold text-danger">{summary.sev1}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">SEV2</div>
          <div className="text-xl font-bold text-warn">{summary.sev2}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search incidents"
            className="input col-span-2 xl:col-span-1"
          />
          {perms.viewAll && (
            <select value={region} onChange={(e) => setRegion(e.target.value as Region)} className="select">
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          )}
          <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity | 'All')} className="select">
            {severities.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Severities' : s}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as IncidentStatus | 'All')} className="select">
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>
            ))}
          </select>
          <select value={impact} onChange={(e) => setImpact(e.target.value as Impact | 'All')} className="select">
            {impacts.map((i) => (
              <option key={i} value={i}>{i === 'All' ? 'All Impact' : i}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      {perms.create && (
        <div className="flex items-center gap-2 mb-4">
          <button className="btn secondary" onClick={() => alert('Create incident (demo)')}>
            + New Incident
          </button>
        </div>
      )}

      {/* Incidents Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="w-24">Incident</th>
              <th className="w-24">Severity</th>
              <th className="w-24">Status</th>
              <th className="w-24">Impact</th>
              {perms.viewAll && <th className="w-24">Region</th>}
              <th className="w-32">Commander</th>
              <th className="w-20">Stations</th>
              <th className="w-20">ETA</th>
              <th className="w-24 !text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="truncate max-w-[128px]">
                  <button className="font-semibold text-text hover:underline text-left" onClick={() => setOpenId(r.id)}>
                    {r.id}
                  </button>
                  <div className="text-xs text-muted truncate" title={r.title}>{r.title}</div>
                </td>
                <td className="whitespace-nowrap">
                  <span className={`pill ${sevColor(r.severity)}`}>{r.severity}</span>
                </td>
                <td className="whitespace-nowrap">
                  <span className={`pill ${statusColor(r.status)}`}>{r.status}</span>
                </td>
                <td className="whitespace-nowrap">{r.impact}</td>
                {perms.viewAll && <td className="whitespace-nowrap">{r.region}</td>}
                <td className="truncate max-w-[96px]" title={r.commander}>{r.commander}</td>
                <td className="text-center">{r.affectedStationsCount > 0 ? r.affectedStationsCount : '—'}</td>
                <td className="whitespace-nowrap">{r.eta}</td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button className="btn secondary" onClick={() => setOpenId(r.id)}>
                      View
                    </button>
                    {perms.resolve && r.status !== 'Resolved' && (
                      <button className="btn secondary" onClick={() => alert(`Resolve ${r.id} (demo)`)}>
                        Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Incident Detail Drawer */}
      {openRow && (
        <IncidentDrawer
          incident={openRow}
          onClose={() => setOpenId(null)}
          perms={perms}
        />
      )}
    </DashboardLayout>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAWER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function IncidentDrawer({
  incident,
  onClose,
  perms,
}: {
  incident: Incident
  onClose: () => void
  perms: Record<string, boolean>
}) {
  function sevColor(sev: Severity) {
    return sev === 'SEV1' ? 'bg-danger text-white' : sev === 'SEV2' ? 'bg-warn text-white' : 'bg-muted/30 text-muted'
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-panel border-l border-border-light shadow-xl p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text">{incident.id}</h3>
              <span className={`pill ${sevColor(incident.severity)}`}>{incident.severity}</span>
            </div>
            <div className="text-sm text-muted">{incident.title}</div>
          </div>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="panel">
            <div className="text-xs text-muted">Status</div>
            <div className="font-semibold">{incident.status}</div>
          </div>
          <div className="panel">
            <div className="text-xs text-muted">Impact</div>
            <div className="font-semibold">{incident.impact}</div>
          </div>
          <div className="panel">
            <div className="text-xs text-muted">Commander</div>
            <div className="font-semibold">{incident.commander}</div>
          </div>
          <div className="panel">
            <div className="text-xs text-muted">ETA</div>
            <div className="font-semibold">{incident.eta}</div>
          </div>
        </div>

        <div className="panel">
          <div className="text-xs text-muted mb-1">Summary</div>
          <div className="text-sm">{incident.summary}</div>
        </div>

        <div className="panel">
          <div className="text-xs text-muted mb-1">Timeline</div>
          <div className="text-sm text-muted">Created: {incident.createdAt}</div>
          <div className="text-sm text-muted">Updated: {incident.updatedAt}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {perms.assign && (
            <button className="btn secondary" onClick={() => alert('Assign commander (demo)')}>
              Assign
            </button>
          )}
          {perms.escalate && (
            <button className="btn secondary" onClick={() => alert('Escalate (demo)')}>
              Escalate
            </button>
          )}
          {perms.resolve && incident.status !== 'Resolved' && (
            <button className="btn" style={{ background: '#03cd8c', color: 'white' }} onClick={() => alert('Resolve (demo)')}>
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

