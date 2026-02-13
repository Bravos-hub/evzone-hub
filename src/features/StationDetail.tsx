import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useStation } from '@/modules/stations/hooks/useStations'
import { useChargePointsByStation } from '@/modules/charge-points/hooks/useChargePoints'
import { useStationSessions } from '@/modules/sessions/hooks/useSessions'
import { PATHS } from '@/app/router/paths'
import { StationStatusPill } from '@/ui/components/StationStatusPill'
import { getErrorMessage } from '@/core/api/errors'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { canAccessStation } from '@/core/auth/rbac'
import { ROLE_GROUPS, isInGroup } from '@/constants/roles'
import { useMemo } from 'react'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import { useAuthStore } from '@/core/auth/authStore'

export function StationDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { user: authUser } = useAuthStore()

  const { data: station, isLoading: stationLoading, error: stationError } = useStation(id || '')
  const { data: chargePoints, isLoading: chargePointsLoading } = useChargePointsByStation(id || '')
  const { data: sessionsData, isLoading: sessionsLoading } = useStationSessions(id || '', false)
  const { data: user, isLoading: userLoading } = useMe()

  const accessContext = useMemo(() => ({
    role: user?.role || authUser?.role,
    userId: user?.id || authUser?.id,
    orgId: user?.orgId || user?.organizationId,
    assignedStations: user?.assignedStations || [],
    capability: user?.ownerCapability || authUser?.ownerCapability,
  }), [user?.role, authUser?.role, user?.id, authUser?.id, user?.orgId, user?.organizationId, user?.assignedStations, user?.ownerCapability, authUser?.ownerCapability])

  const canManage = useMemo(() => {
    if (!user || !station) return false

    // Platform Admins always have access
    if (isInGroup(user.role, ROLE_GROUPS.PLATFORM_ADMINS)) return true

    // If station has an operator, Owner loses management rights
    if (station.operatorId && user.role === 'STATION_OWNER') return false

    // Station Operators can manage their assigned stations
    if (user.role === 'STATION_OPERATOR') return true

    return isInGroup(user.role, ROLE_GROUPS.STATION_MANAGERS)
  }, [user, station])

  if (stationLoading) {
    return (
      <DashboardLayout pageTitle="Station Details">
        <div className="card">
          <TextSkeleton lines={2} centered />
        </div>
      </DashboardLayout>
    )
  }

  if (userLoading) {
    return (
      <DashboardLayout pageTitle="Station Details">
        <div className="card">
          <TextSkeleton lines={2} centered />
        </div>
      </DashboardLayout>
    )
  }

  if (stationError || !station) {
    return (
      <DashboardLayout pageTitle="Station Details">
        <div className="card bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">
            {stationError ? getErrorMessage(stationError) : 'Station not found'}
          </div>
          <Link to={PATHS.STATIONS.ROOT} className="btn secondary mt-4">
            Back to Stations
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const isPlatformOps = authUser?.role ? ROLE_GROUPS.PLATFORM_OPS.includes(authUser.role) : false
  const canViewStation = canAccessStation(accessContext, station, 'ANY') || isPlatformOps

  if (!canViewStation) {
    return (
      <DashboardLayout pageTitle="Station Details">
        <div className="card">
          <p className="text-muted">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  const sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData as any)?.recent || []

  return (
    <DashboardLayout pageTitle="Station Details">
      <div className="mb-6">
        <Link to={PATHS.STATIONS.ROOT} className="text-sm text-subtle hover:text-text mb-2 inline-block">
          ← Back to Stations
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{station.name}</h1>
            <p className="text-muted">{station.address}</p>
          </div>
          <StationStatusPill status={station.status === 'ACTIVE' ? 'Online' : station.status === 'INACTIVE' ? 'Offline' : 'Maintenance'} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="text-xs text-muted mb-1">Status</div>
          <div className="text-xl font-bold">
            <StationStatusPill status={station.status === 'ACTIVE' ? 'Online' : station.status === 'INACTIVE' ? 'Offline' : 'Maintenance'} />
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-muted mb-1">Type</div>
          <div className="text-xl font-bold">{station.type}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted mb-1">Charge Points</div>
          <div className="text-xl font-bold">{chargePoints?.length || 0}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted mb-1">Recent Sessions</div>
          <div className="text-xl font-bold">{sessions.length}</div>
        </div>
      </div>

      {/* Station Info */}
      <div className="card mb-4">
        <h2 className="text-xl font-bold mb-4">Station Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted mb-1">Type</div>
            <div className="font-semibold">{station.type}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Organization</div>
            <div className="font-semibold">{station.orgId || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Coordinates</div>
            <div className="font-semibold text-sm">{station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}</div>
          </div>
          {station.tags && station.tags.length > 0 && (
            <div className="md:col-span-2">
              <div className="text-xs text-muted mb-1">Tags</div>
              <div className="flex flex-wrap gap-2">
                {station.tags.map((tag: string) => (
                  <span key={tag} className="chip text-xs">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Operator Info (Visible to Owners & Admins) */}
      {(station.operatorId || user?.role === 'STATION_OWNER') && (
        <div className="card mb-4 border-l-4 border-accent">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Operator & Contract</h2>
            {!station.operatorId && user?.role === 'STATION_OWNER' && (
              <button className="btn secondary text-xs" onClick={() => nav(`/stations/${station.id}/assign-operator`)}>
                Assign Operator
              </button>
            )}
          </div>
          {station.operatorId ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted mb-1">Operator ID</div>
                <div className="font-semibold">{station.operatorId}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Contract Type</div>
                <div className="font-semibold">{station.contractType || 'REVENUE_SHARE'}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Revenue Share</div>
                <div className="font-semibold">{station.revenueShare || 15}%</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Status</div>
                <div className="text-emerald-500 font-semibold">Active Management</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted italic">
              No operator assigned. You currently have full management rights for this station.
            </div>
          )}
        </div>
      )}

      {/* Charge Points */}
      <div className="card mb-4">
        <h2 className="text-xl font-bold mb-4">Charge Points</h2>
        {chargePointsLoading ? (
          <div className="py-4">
            <TextSkeleton lines={2} centered />
          </div>
        ) : chargePoints && chargePoints.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Manufacturer</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Connectors</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chargePoints.map((cp: any) => (
                  <tr key={cp.id}>
                    <td className="font-semibold">{cp.id}</td>
                    <td>{cp.manufacturer}</td>
                    <td>{cp.model}</td>
                    <td><StationStatusPill status={cp.status} /></td>
                    <td>{Array.isArray(cp.connectors) ? cp.connectors.length : 0}</td>
                    <td className="text-right">
                      {canManage ? (
                        <button
                          className="btn secondary text-xs font-bold"
                          onClick={() => nav(PATHS.STATIONS.CHARGE_POINT_DETAIL(cp.id))}
                        >
                          Manage
                        </button>
                      ) : (
                        <button className="btn secondary text-xs">View</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted">No charge points found</div>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
        {sessionsLoading ? (
          <div className="py-4">
            <TextSkeleton lines={2} centered />
          </div>
        ) : sessions.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Start Time</th>
                  <th>Energy (kWh)</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 10).map((session: any) => (
                  <tr key={session.id}>
                    <td className="font-semibold">
                      <Link to={`/sessions/${session.id}`} className="text-accent hover:underline">
                        {session.id}
                      </Link>
                    </td>
                    <td>{new Date(session.startedAt).toLocaleString()}</td>
                    <td>{session.energyDelivered?.toFixed(2) || '—'}</td>
                    <td>${session.cost?.toFixed(2) || '0.00'}</td>
                    <td>
                      <span className={`pill ${session.status === 'COMPLETED' ? 'approved' :
                        session.status === 'ACTIVE' ? 'active' :
                          'rejected'
                        }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link to={`/sessions/${session.id}`} className="btn secondary text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted">No recent sessions</div>
        )}
      </div>
    </DashboardLayout>
  )
}

