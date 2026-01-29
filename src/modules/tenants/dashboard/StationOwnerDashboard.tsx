import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '@/ui/components/Card'
import { PATHS } from '@/app/router/paths'
import { getErrorMessage } from '@/core/api/errors'
import { useUpdateStation } from '@/modules/stations/hooks/useStations'
import { useAssignedOperator, useStationOwnerStats, useTenantSites } from '../hooks/useTenantDashboard'
import { StationOwnerLayout, type StationOwnerTab } from '../components/StationOwnerLayout'
import { SelfManagedView } from '../components/SelfManagedView'
import { DelegatedView } from '../components/DelegatedView'
import { OperatorAssignmentModal } from '../components/OperatorAssignmentModal'
import { KpiCardSkeleton, SiteCardSkeleton } from '@/ui/components/SkeletonCards'
import type { TenantSiteSummary } from '../types/tenant'

export function StationOwnerDashboard() {
  const { data: stats, isLoading: loadingStats } = useStationOwnerStats()
  const { data: sites = [], isLoading: loadingSites } = useTenantSites()
  const { mutateAsync: updateStation } = useUpdateStation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialTab = searchParams.get('tab') === 'leases' ? 'leases' : 'assets'
  const [activeTab, setActiveTab] = useState<StationOwnerTab>(initialTab)

  const [assignmentTarget, setAssignmentTarget] = useState<TenantSiteSummary | null>(null)
  const [assignmentError, setAssignmentError] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [revokingSiteId, setRevokingSiteId] = useState<string | null>(null)

  const handleTabChange = (tab: StationOwnerTab) => {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  const handleAssignOperator = async (payload: { operatorId: string; contractType: TenantSiteSummary['stations'][number]['contractType']; revenueShare?: number }) => {
    if (!assignmentTarget) return
    if (assignmentTarget.stations.length === 0) {
      setAssignmentError('No stations are connected to this site yet.')
      return
    }

    setIsAssigning(true)
    setAssignmentError('')
    try {
      await Promise.all(
        assignmentTarget.stations.map(station =>
          updateStation({
            id: station.id,
            data: {
              operatorId: payload.operatorId,
              contractType: payload.contractType,
              revenueShare: payload.revenueShare,
            },
          })
        )
      )
      setAssignmentTarget(null)
    } catch (error) {
      setAssignmentError(getErrorMessage(error))
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRevokeAccess = async (site: TenantSiteSummary) => {
    if (site.stations.length === 0) {
      setAssignmentError('No stations are connected to this site yet.')
      return
    }
    if (!window.confirm(`Revoke operator access for ${site.siteName}?`)) {
      return
    }

    setRevokingSiteId(site.siteId)
    setAssignmentError('')
    try {
      await Promise.all(
        site.stations.map(station =>
          updateStation({
            id: station.id,
            data: {
              operatorId: undefined,
            },
          })
        )
      )
    } catch (error) {
      setAssignmentError(getErrorMessage(error))
    } finally {
      setRevokingSiteId(null)
    }
  }

  const isLoading = loadingStats || loadingSites
  const statsSnapshot = stats || {
    totalStations: 0,
    activeStations: 0,
    totalRevenue: 0,
    uptime: 0,
    activeLeases: 0,
    pendingApplications: 0,
  }

  return (
    <StationOwnerLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      assetsCount={sites.length}
      leasesCount={statsSnapshot.activeLeases}
    >
      {assignmentError && (
        <div className="rounded-lg bg-danger/10 text-danger px-4 py-2 text-sm">{assignmentError}</div>
      )}

      {isLoading && (
        <div className="space-y-8">
          <section>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </div>
          </section>
          <section>
            <div className="grid grid-cols-1 gap-6">
              <SiteCardSkeleton />
              <SiteCardSkeleton />
            </div>
          </section>
        </div>
      )}

      {!isLoading && activeTab === 'assets' && (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">My Fleet Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KpiCard
                label="Total Stations"
                value={statsSnapshot.totalStations}
                subValue={`${statsSnapshot.activeStations} Active`}
                icon={<StationIcon />}
              />
              <KpiCard
                label="Total Revenue"
                value={`$${statsSnapshot.totalRevenue.toLocaleString()}`}
                subValue="This Month"
                icon={<RevenueIcon />}
              />
              <KpiCard
                label="Uptime"
                value={`${statsSnapshot.uptime}%`}
                subValue="Network Wide"
                icon={<UptimeIcon />}
                tone="text-ok"
              />
              <KpiCard
                label="Active Leases"
                value={statsSnapshot.activeLeases}
                subValue={`${statsSnapshot.pendingApplications} Pending`}
                icon={<LeaseIcon />}
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
                Site Operations ({sites.length})
              </h2>
              <button className="btn secondary text-xs" onClick={() => navigate(PATHS.SITE_OWNER.SITES)}>
                Browse Sites
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {sites.map(site => (
                <TenantSiteCard
                  key={site.siteId}
                  site={site}
                  isRevoking={revokingSiteId === site.siteId}
                  onInviteOperator={() => setAssignmentTarget(site)}
                  onRevokeOperator={() => handleRevokeAccess(site)}
                  onViewDetails={() =>
                    site.stations[0]?.id
                      ? navigate(PATHS.STATIONS.DETAIL(site.stations[0].id))
                      : navigate(PATHS.STATIONS.ROOT)
                  }
                />
              ))}
              {sites.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted">You have no active sites yet.</p>
                  <button className="btn mt-4" onClick={() => navigate(PATHS.SITE_OWNER.SITES)}>
                    Browse Sites
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {!isLoading && activeTab === 'leases' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Lease Portfolio</h2>
            <div className="grid gap-4">
              {sites.map(site => (
                <Card key={site.siteId} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{site.siteName}</div>
                      <div className="text-xs text-muted">{site.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-muted">Lease Status</div>
                      <div className="text-sm font-semibold">{site.leaseStatus}</div>
                      <div className="text-[10px] text-muted">Ops: {site.isDelegated ? 'Delegated' : 'Self-Managed'}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted">
                    <div>
                      <div className="text-[10px] uppercase">Revenue</div>
                      <div className="text-sm font-semibold text-text">${site.revenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase">Energy</div>
                      <div className="text-sm font-semibold text-text">{site.energy.toLocaleString()} kWh</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase">Sessions</div>
                      <div className="text-sm font-semibold text-text">{site.sessions}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase">Uptime</div>
                      <div className="text-sm font-semibold text-text">{site.uptime}%</div>
                    </div>
                  </div>
                </Card>
              ))}
              {sites.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted">No leases available yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <OperatorAssignmentModal
        open={Boolean(assignmentTarget)}
        siteName={assignmentTarget?.siteName || ''}
        initialOperatorId={assignmentTarget?.operatorId}
        onClose={() => setAssignmentTarget(null)}
        onAssign={handleAssignOperator}
        isSubmitting={isAssigning}
      />
    </StationOwnerLayout>
  )
}

function TenantSiteCard({
  site,
  onInviteOperator,
  onRevokeOperator,
  onViewDetails,
  isRevoking,
}: {
  site: TenantSiteSummary
  onInviteOperator: () => void
  onRevokeOperator: () => void
  onViewDetails: () => void
  isRevoking: boolean
}) {
  const { data: operator } = useAssignedOperator(site.siteId)
  const statusClass =
    site.status === 'Active' ? 'approved' : site.status === 'Pending' ? 'pending' : 'rejected'

  return (
    <Card className="p-0 overflow-hidden border-l-4 border-l-accent">
      <div className="p-6 border-b border-border bg-card-header flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{site.siteName}</h3>
            <span className={`pill ${statusClass}`}>{site.status}</span>
          </div>
          <div className="text-sm text-muted mt-1">{site.address}</div>
          <div className="text-xs text-muted mt-2">Lease: {site.leaseStatus}</div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-muted font-bold uppercase">Operational Model</div>
            <div className={`text-sm font-medium ${site.isDelegated ? 'text-accent' : 'text-ok'}`}>
              {site.isDelegated
                ? `Managed by ${operator?.name || site.operatorName || site.operatorId || 'Operator'}`
                : 'Self-Managed'}
            </div>
          </div>
          {site.isDelegated ? (
            <button className="btn secondary text-xs" onClick={onRevokeOperator} disabled={isRevoking}>
              {isRevoking ? 'Revoking...' : 'Revoke Access'}
            </button>
          ) : (
            <button className="btn secondary text-xs" onClick={onInviteOperator}>
              Invite Operator
            </button>
          )}
          <button className="btn primary text-xs" onClick={onViewDetails}>
            View Details
          </button>
        </div>
      </div>

      <div className="p-6 bg-muted/5">
        {site.isDelegated ? <DelegatedView site={site} operator={operator} /> : <SelfManagedView site={site} />}
      </div>
    </Card>
  )
}

function KpiCard({
  label,
  value,
  subValue,
  icon,
  trend,
  tone = 'text-text',
}: {
  label: string
  value: ReactNode
  subValue: string
  icon: ReactNode
  trend?: string
  tone?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold uppercase text-muted">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-muted/20 text-muted flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="flex justify-between items-center mt-1">
        <div className="text-xs text-muted">{subValue}</div>
        {trend && <div className="text-[10px] font-bold text-ok bg-ok/10 px-1.5 py-0.5 rounded">{trend}</div>}
      </div>
    </Card>
  )
}

function StationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 21h16" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M9 9h6" />
      <path d="M9 13h6" />
    </svg>
  )
}

function RevenueIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v18" />
      <path d="M17 7a4 4 0 0 0-4-2H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H9a4 4 0 0 1-4-2" />
    </svg>
  )
}

function UptimeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

function LeaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h4" />
      <path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    </svg>
  )
}
