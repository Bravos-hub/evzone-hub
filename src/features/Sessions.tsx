import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { canAccessStation } from '@/core/auth/rbac'
import type { SessionStatus } from '@/core/types/domain'
import { getErrorMessage } from '@/core/api/errors'
import { auditLogger } from '@/core/utils/auditLogger'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { useSessionHistory, useStopSession } from '@/modules/sessions/hooks/useSessions'
import { useStations } from '@/modules/stations/hooks/useStations'

type SessionRow = {
  id: string
  stationId: string
  chargePointId: string
  connectorId: string
  userId?: string
  userName?: string
  site: string
  start: Date
  end?: Date
  status: SessionStatus
  energyKwh: number
  amount: number
  tariffName: string
}

type SessionPreset = 'active' | 'today' | 'last7' | 'last30' | 'custom'

function normalizeSessionPreset(value: string | null): SessionPreset {
  switch ((value ?? '').toLowerCase()) {
    case 'active':
      return 'active'
    case 'today':
      return 'today'
    case 'last7':
      return 'last7'
    case 'custom':
      return 'custom'
    default:
      return 'last30'
  }
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function subtractDays(base: Date, days: number) {
  const next = new Date(base)
  next.setDate(next.getDate() - days)
  return next
}

function mapApiStatus(status: string): SessionStatus {
  switch ((status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'Active'
    case 'COMPLETED':
      return 'Completed'
    case 'STOPPED':
      return 'Stopped'
    default:
      return 'Stopped'
  }
}

function canAccessSessionStation(
  accessContext: {
    role?: string
    userId?: string
    orgId?: string
    assignedStations?: string[]
    capability?: string
    viewAll?: boolean
    stationContextIds?: string[]
  },
  station: any,
) {
  if (!accessContext.role) return false

  if (canAccessStation(accessContext as any, station, 'ANY')) return true

  const stationContextIds = accessContext.stationContextIds || []
  if (stationContextIds.length === 0) return false

  return stationContextIds.includes(station.id) || (station.code ? stationContextIds.includes(station.code) : false)
}

export function Sessions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { data: me } = useMe()
  const perms = getPermissionsForFeature(user?.role, 'sessions')
  const filtersRef = useRef<HTMLDivElement | null>(null)
  const defaultFrom = useMemo(() => formatDateInput(subtractDays(new Date(), 29)), [])
  const defaultTo = useMemo(() => formatDateInput(new Date()), [])

  const [site, setSite] = useState('All Sites')
  const [status, setStatus] = useState<SessionStatus | 'All'>('All')
  const [tariff, setTariff] = useState('All Tariffs')
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [stationFilter, setStationFilter] = useState<string>('All')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const preset = useMemo<SessionPreset>(() => normalizeSessionPreset(searchParams.get('preset')), [searchParams])
  const effectiveApiStatus = status !== 'All'
    ? status.toUpperCase()
    : preset === 'active'
      ? 'ACTIVE'
      : undefined

  const { data: stationsData } = useStations()
  const { data: historyData } = useSessionHistory({
    page: 1,
    limit: 100,
    status: effectiveApiStatus,
    stationId: stationFilter !== 'All' ? stationFilter : undefined,
  })

  const accessContext = useMemo(() => {
    const viewerOrgId =
      me?.activeOrganizationId ||
      me?.orgId ||
      me?.organizationId ||
      user?.activeOrganizationId ||
      user?.orgId ||
      user?.organizationId
    const stationContextIds = Array.from(
      new Set(
        (user?.stationContexts || [])
          .flatMap((context) => [context.stationId, context.assignmentId])
          .concat(user?.activeStationContext?.stationId ? [user.activeStationContext.stationId] : [])
          .filter(Boolean) as string[],
      ),
    )

    return {
      role: user?.role,
      userId: user?.id,
      orgId: viewerOrgId,
      assignedStations: me?.assignedStations || [],
      capability: me?.ownerCapability || user?.ownerCapability,
      viewAll: perms.viewAll,
      stationContextIds,
    }
  }, [
    me?.activeOrganizationId,
    me?.assignedStations,
    me?.orgId,
    me?.organizationId,
    me?.ownerCapability,
    perms.viewAll,
    user?.activeOrganizationId,
    user?.activeStationContext?.stationId,
    user?.id,
    user?.orgId,
    user?.organizationId,
    user?.ownerCapability,
    user?.role,
    user?.stationContexts,
  ])

  const accessibleStationsData = useMemo(() => {
    if (!stationsData) return []
    return stationsData.filter((station) => canAccessSessionStation(accessContext, station))
  }, [accessContext, stationsData])

  const accessibleStationIds = useMemo(
    () => new Set(accessibleStationsData.map((station) => station.id)),
    [accessibleStationsData],
  )

  const stationOptions = useMemo(
    () => accessibleStationsData.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [accessibleStationsData],
  )

  const baseRows = useMemo<SessionRow[]>(() => {
    if (!historyData?.sessions) return []

    return historyData.sessions
      .map((session: any): SessionRow => ({
        id: session.id,
        stationId: session.stationId || session.chargePointId || '',
        chargePointId: session.stationId || session.chargePointId || session.stationName || 'N/A',
        connectorId: session.connectorId || 'N/A',
        userId: session.userId,
        userName: session.userName,
        site: session.stationName || session.station?.name || 'Unknown',
        start: new Date(session.startedAt),
        end: session.endedAt ? new Date(session.endedAt) : undefined,
        status: mapApiStatus(session.status),
        energyKwh: session.energyDelivered || 0,
        amount: session.cost || 0,
        tariffName: session.tariff?.name || session.tariffName || 'Standard',
      }))
      .filter((row) => accessibleStationIds.has(row.stationId))
  }, [accessibleStationIds, historyData])

  const siteOptions = useMemo(
    () => ['All Sites', ...Array.from(new Set(baseRows.map((row) => row.site).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [baseRows],
  )

  const tariffOptions = useMemo(
    () => ['All Tariffs', ...Array.from(new Set(baseRows.map((row) => row.tariffName).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [baseRows],
  )

  const rows = useMemo<SessionRow[]>(() => {
    return baseRows
      .filter((row) => (site === 'All Sites' ? true : row.site === site))
      .filter((row) => (tariff === 'All Tariffs' ? true : row.tariffName === tariff))
      .filter((row) => (status === 'All' ? true : row.status === status))
      .filter((row) => {
        if (preset === 'active') return row.status === 'Active'
        if (preset === 'today') {
          const now = new Date()
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const endOfToday = new Date(startOfToday)
          endOfToday.setDate(endOfToday.getDate() + 1)
          return row.start >= startOfToday && row.start < endOfToday
        }
        if (preset === 'last7') {
          const startDate = subtractDays(new Date(), 6)
          startDate.setHours(0, 0, 0, 0)
          return row.start >= startDate
        }
        if (preset === 'last30') {
          const startDate = subtractDays(new Date(), 29)
          startDate.setHours(0, 0, 0, 0)
          return row.start >= startDate
        }
        const fromDate = new Date(from)
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        return row.start >= fromDate && row.start <= toDate
      })
      .filter((row) =>
        q
          ? [
              row.id,
              row.chargePointId,
              row.connectorId,
              row.site,
              row.userName ?? '',
              row.userId ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(q.toLowerCase())
          : true,
      )
  }, [baseRows, from, preset, q, site, status, tariff, to])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (preset !== 'last30') count += 1
    if (stationFilter !== 'All') count += 1
    if (status !== 'All') count += 1
    if (site !== 'All Sites') count += 1
    if (tariff !== 'All Tariffs') count += 1
    if (preset === 'custom' && from !== defaultFrom) count += 1
    if (preset === 'custom' && to !== defaultTo) count += 1
    return count
  }, [defaultFrom, defaultTo, from, preset, site, stationFilter, status, tariff, to])

  const stats = {
    total: rows.length,
    completed: rows.filter((row) => row.status === 'Completed').length,
    stopped: rows.filter((row) => row.status === 'Stopped').length,
    active: rows.filter((row) => row.status === 'Active').length,
    totalKwh: rows.reduce((acc, row) => acc + (row.energyKwh || 0), 0),
    totalRevenue: rows.reduce((acc, row) => acc + row.amount, 0),
  }

  const allSel = rows.length > 0 && rows.every((row) => sel[row.id])
  const someSel = rows.some((row) => sel[row.id])

  useEffect(() => {
    if (!isFiltersOpen) return

    function onPointerDown(event: MouseEvent) {
      const el = filtersRef.current
      if (!el) return
      if (event.target instanceof Node && !el.contains(event.target)) {
        setIsFiltersOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFiltersOpen(false)
      }
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isFiltersOpen])

  const setPreset = (nextPreset: SessionPreset) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('preset', nextPreset)
    setSearchParams(nextParams)
  }

  const resetFilters = () => {
    setStatus('All')
    setStationFilter('All')
    setSite('All Sites')
    setTariff('All Tariffs')
    setFrom(defaultFrom)
    setTo(defaultTo)
    setQ('')
    setPreset('last30')
  }

  const duration = (start: Date, end?: Date) => {
    if (!end) return '—'
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
    return `${minutes} min`
  }

  function toggleAll() {
    const next: Record<string, boolean> = {}
    const val = !allSel
    rows.forEach((row) => {
      next[row.id] = val
    })
    setSel(next)
  }

  function toggle(id: string) {
    setSel((s) => ({ ...s, [id]: !s[id] }))
  }

  async function bulkRefund() {
    const ids = rows.filter((row) => sel[row.id]).map((row) => row.id)
    await new Promise((resolve) => setTimeout(resolve, 400))
    alert(`Refund initiated for: ${ids.join(', ')} (demo)`)
    setSel({})
  }

  async function exportSessions() {
    alert('Exporting sessions... (demo)')
  }

  return (
    <DashboardLayout pageTitle="Sessions">
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="card">
          <div className="text-xs text-muted">Total Sessions</div>
          <div className="text-xl font-bold text-text">{stats.total}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Completed</div>
          <div className="text-xl font-bold text-ok">{stats.completed}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Stopped</div>
          <div className="text-xl font-bold text-danger">{stats.stopped}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Active</div>
          <div className="text-xl font-bold text-warn">{stats.active}</div>
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

      <div className="card relative z-20 overflow-visible">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full lg:w-[420px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Session ID, Charger, Connector, or User"
              className="input"
            />
          </div>

          <div className="relative z-30" ref={filtersRef}>
            <button
              type="button"
              className="btn secondary min-w-[112px]"
              onClick={() => setIsFiltersOpen((open) => !open)}
              aria-haspopup="dialog"
              aria-expanded={isFiltersOpen}
              aria-label="Open filters"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M6 12h12" />
                <path d="M10 18h4" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {isFiltersOpen && (
              <div
                className="absolute right-0 top-[calc(100%+12px)] z-[140] w-[min(420px,calc(100vw-3rem))] rounded-2xl border border-border-light bg-panel p-4 shadow-xl"
                role="dialog"
                aria-label="Session filters"
              >
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Quick Filters</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'active', label: 'Active' },
                        { value: 'today', label: 'Today' },
                        { value: 'last7', label: 'Last 7 Days' },
                        { value: 'last30', label: 'Last 30 Days' },
                        { value: 'custom', label: 'Custom Range' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={preset === option.value ? 'btn px-3 py-2 text-xs' : 'btn secondary px-3 py-2 text-xs'}
                          onClick={() => setPreset(option.value as SessionPreset)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Status</span>
                      <select value={status} onChange={(e) => setStatus(e.target.value as SessionStatus | 'All')} className="select">
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Stopped">Stopped</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Station</span>
                      <select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)} className="select">
                        <option value="All">All Stations</option>
                        {stationOptions.map((station) => (
                          <option key={station.id} value={station.id}>{station.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="border-t border-border-light pt-4">
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Advanced Filters</div>
                    <div className="grid gap-3">
                      <label className="grid gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Site</span>
                        <select value={site} onChange={(e) => setSite(e.target.value)} className="select">
                          {siteOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">Tariff</span>
                        <select value={tariff} onChange={(e) => setTariff(e.target.value)} className="select">
                          {tariffOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                      {preset === 'custom' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="grid gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">From</span>
                            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
                          </label>
                          <label className="grid gap-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">To</span>
                            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border-light pt-3">
                    <div className="text-xs text-muted">
                      {activeFilterCount > 0 ? `${activeFilterCount} active filters` : 'Using default operational filters'}
                    </div>
                    <button type="button" className="btn secondary px-3 py-2 text-xs" onClick={resetFilters}>
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 mt-4 flex items-center gap-2">
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

      {isFiltersOpen ? (
        <div className="card border-dashed">
          <div className="text-sm font-semibold text-text">Filters open</div>
          <div className="mt-1 text-sm text-muted">
            The sessions table is hidden while you refine filters. Close the filter panel to view the scoped results.
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <div className="text-sm font-semibold text-text">No sessions found</div>
          <div className="mt-1 text-sm text-muted">
            There are no accessible sessions for your current role and filter combination.
          </div>
        </div>
      ) : (
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
                <th className="w-20">Status</th>
                <th className="w-20 !text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {perms.refund && (
                    <td>
                      <input type="checkbox" className="h-4 w-4" checked={!!sel[row.id]} onChange={() => toggle(row.id)} />
                    </td>
                  )}
                  <td className="max-w-[80px] truncate font-semibold">
                    <Link to={`/sessions/${row.id}`} className="text-accent hover:underline">
                      {row.id}
                    </Link>
                  </td>
                  <td className="max-w-[112px] truncate" title={row.site}>{row.site}</td>
                  <td className="max-w-[112px] truncate" title={`${row.chargePointId}/${row.connectorId}`}>
                    {row.chargePointId}/{row.connectorId}
                  </td>
                  <td className="whitespace-nowrap text-xs">{row.start.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="whitespace-nowrap text-xs">
                    {row.end
                      ? row.end.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap text-xs">{duration(row.start, row.end)}</td>
                  <td className="whitespace-nowrap text-right text-xs">{row.energyKwh?.toFixed(1) || '—'}</td>
                  <td className="max-w-[80px] truncate text-xs" title={row.tariffName}>{row.tariffName}</td>
                  <td className="whitespace-nowrap text-right text-xs">${row.amount.toFixed(2)}</td>
                  <td>
                    <span
                      className={`pill whitespace-nowrap ${
                        row.status === 'Completed'
                          ? 'approved'
                          : row.status === 'Stopped'
                            ? 'rejected'
                            : 'sendback'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link to={`/sessions/${row.id}`} className="rounded border border-border px-2 py-1 text-xs transition-colors hover:bg-muted">
                        View
                      </Link>
                      {perms.refund && row.status === 'Completed' && (
                        <button className="rounded border border-border px-2 py-1 text-xs transition-colors hover:bg-muted" onClick={() => alert(`Refund ${row.id} (demo)`)}>
                          Refund
                        </button>
                      )}
                      {perms.stopSession && row.status === 'Active' && (
                        <StopSessionButton sessionId={row.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}

function StopSessionButton({ sessionId }: { sessionId: string }) {
  const stopSessionMutation = useStopSession()
  const [stopping, setStopping] = useState(false)

  const handleStop = async () => {
    if (!window.confirm(`Are you sure you want to stop session ${sessionId}?`)) return
    setStopping(true)
    try {
      await stopSessionMutation.mutateAsync({ id: sessionId, reason: 'Manually stopped by admin' })
      auditLogger.sessionStopped(sessionId, 'Manually stopped by admin')
    } catch (err) {
      alert(`Failed to stop session: ${getErrorMessage(err)}`)
    } finally {
      setStopping(false)
    }
  }

  return (
    <button
      className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
      onClick={handleStop}
      disabled={stopping || stopSessionMutation.isPending}
    >
      {stopping || stopSessionMutation.isPending ? 'Stopping...' : 'Stop'}
    </button>
  )
}
