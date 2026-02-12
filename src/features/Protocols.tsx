import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useChargePoints } from '@/modules/charge-points/hooks/useChargePoints'
import { useStations } from '@/modules/stations/hooks/useStations'
import { usePartners } from '@/modules/organizations/hooks/usePartners'
import { useSystemHealth } from '@/modules/analytics/hooks/useAnalytics'
import { API_CONFIG } from '@/core/api/config'
import { getErrorMessage } from '@/core/api/errors'
import type { ChargePoint, Connector, Station } from '@/core/api/types'
import { TableSkeleton, TextSkeleton } from '@/ui/components/SkeletonCards'

const mapStatus = (status?: string): 'Online' | 'Warning' | 'Offline' => {
  const v = String(status || '').toLowerCase()
  if (v.includes('offline') || v.includes('down')) return 'Offline'
  if (v.includes('degraded') || v.includes('maintenance')) return 'Warning'
  return 'Online'
}

const inferOcppVersion = (cp: ChargePoint): string => {
  const v = String(cp.ocppStatus || '').toLowerCase()
  if (v.includes('2.0')) return '2.0.1'
  if (v.includes('1.6')) return '1.6J'
  return '1.6J'
}

const formatHeartbeat = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '-'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const normalizeChargePoints = (data: unknown): ChargePoint[] => {
  if (Array.isArray(data)) return data as ChargePoint[]
  return (data as any)?.data || []
}

const normalizeStations = (data: unknown): Station[] => {
  if (Array.isArray(data)) return data as Station[]
  return (data as any)?.data || []
}

const csmsUrlFor = (ver: string, chargeBoxId?: string) => {
  const base = API_CONFIG.baseURL.replace(/^http/, 'ws')
  const trimmed = base.replace(/\/api\/v\d+\/?$/, '')
  const versionPath = ver === '1.6J' ? '1.6' : ver === '2.1' ? '2.1' : '2.0.1'
  return chargeBoxId ? `${trimmed}/ocpp/${versionPath}/${chargeBoxId}` : `${trimmed}/ocpp/${versionPath}`
}

export function Protocols() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'protocolsConsole')

  const { data: chargePointsData, isLoading: chargePointsLoading, error: chargePointsError } = useChargePoints()
  const { data: stationsData, isLoading: stationsLoading } = useStations()
  const { data: partnersData, isLoading: partnersLoading, error: partnersError } = usePartners()
  const { data: healthData, isLoading: healthLoading, error: healthError } = useSystemHealth() as any

  const [q, setQ] = useState('')
  const [ver, setVer] = useState<'All' | string>('All')
  const [make, setMake] = useState<'All' | string>('All')

  const stations = useMemo<Station[]>(() => normalizeStations(stationsData), [stationsData])
  const stationMap = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations])

  const endpoints = useMemo(() => {
    return normalizeChargePoints(chargePointsData).map((cp) => {
      const connectors = (cp.connectors || []).map((c: Connector) => ({
        id: c.id,
        t: c.type,
        kw: c.maxPowerKw,
        status: c.status,
      }))

      const maxKw = connectors.reduce((max, c) => Math.max(max, c.kw || 0), 0)
      const activeSessions = connectors.filter((c) => String(c.status).toLowerCase() === 'occupied').length

      return {
        id: cp.id,
        site: stationMap.get(cp.stationId)?.name || cp.stationId || 'Unknown',
        make: cp.manufacturer || 'Unknown',
        model: cp.model || 'Unknown',
        ver: inferOcppVersion(cp),
        vendor: cp.manufacturer || 'Unknown',
        fw: cp.firmwareVersion || '-',
        status: mapStatus(cp.status),
        hb: formatHeartbeat(cp.lastHeartbeat),
        chargeBoxId: cp.ocppId || cp.id,
        connectors,
        maxKw,
        activeSessions,
      }
    })
  }, [chargePointsData, stationMap])

  const rows = useMemo(() => {
    return endpoints
      .filter((r) => (q ? (r.id + ' ' + r.site + ' ' + r.make + ' ' + r.model).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (ver === 'All' ? true : r.ver === ver))
      .filter((r) => (make === 'All' ? true : r.make === make))
  }, [endpoints, q, ver, make])

  const makeOptions = useMemo(() => {
    const set = new Set<string>()
    endpoints.forEach((r) => {
      if (r.make) set.add(r.make)
    })
    return ['All', ...Array.from(set)]
  }, [endpoints])

  const ocpiPeers = useMemo(() => {
    const partners = Array.isArray(partnersData) ? partnersData : []
    return partners.map((p) => ({
      id: p.name || p.id,
      status: p.status || 'Unknown',
      lastSync: p.lastSync || '-',
    }))
  }, [partnersData])

  const mqttService = useMemo(() => {
    const services = (healthData as any)?.services || []
    return services.find((s: any) => String(s.name || s.id || '').toLowerCase().includes('mqtt'))
  }, [healthData])

  const mqttStatus = mqttService ? mapStatus(mqttService.status) : 'Offline'
  const mqttRate = mqttService?.rate || mqttService?.throughput || '-'
  const mqttTopics = mqttService?.topics || mqttService?.topicCount || '-'

  function copy(text: string, msg: string) {
    if (!text) return
    navigator?.clipboard?.writeText?.(text)
    alert(msg)
  }

  if (!perms.access) {
    return (
      <DashboardLayout pageTitle="Protocols Console">
        <div className="card">
          <p className="text-muted">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  const isLoading = chargePointsLoading || stationsLoading || partnersLoading || healthLoading
  const error = chargePointsError || partnersError || healthError

  return (
    <DashboardLayout pageTitle="Protocols Console">
      <div className="space-y-4">
        {error && (
          <div className="card mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">
            {getErrorMessage(error)}
          </div>
        )}

        {/* Filters */}
        <div className="card grid md:grid-cols-5 gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search charger/site/make/model" className="input md:col-span-2" />
          <select value={ver} onChange={(e) => setVer(e.target.value)} className="select">
            {['All', '1.6J', '2.0.1'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select value={make} onChange={(e) => setMake(e.target.value)} className="select">
            {makeOptions.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <div className="text-sm text-muted self-center">{rows.length} result(s)</div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <div className="card">
              <TextSkeleton lines={2} />
            </div>
            <div className="card">
              <TableSkeleton rows={6} cols={9} />
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* OCPP table */}
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Charger</th>
                    <th>Site</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>OCPP</th>
                    <th>Max kW</th>
                    <th>Status</th>
                    <th>Heartbeat</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="font-semibold">{r.id}</td>
                      <td>{r.site}</td>
                      <td>{r.make}</td>
                      <td>{r.model}</td>
                      <td>{r.ver}</td>
                      <td>{r.maxKw} kW</td>
                      <td>
                        <span
                          className={`pill ${
                            r.status === 'Online'
                              ? 'approved'
                              : r.status === 'Warning'
                              ? 'pending'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>{r.hb}</td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <button className="btn secondary" onClick={() => copy(csmsUrlFor(r.ver, r.chargeBoxId), 'CSMS URL copied')}>
                            CSMS URL
                          </button>
                          <button className="btn secondary" onClick={() => copy(r.chargeBoxId, 'ChargeBoxId copied')}>
                            ID
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() =>
                              copy(
                                JSON.stringify(
                                  {
                                    CSMS: csmsUrlFor(r.ver, r.chargeBoxId),
                                    ChargeBoxId: r.chargeBoxId,
                                    OcppVersion: r.ver,
                                    hardware: { make: r.make, model: r.model },
                                    maxKw: r.maxKw,
                                  },
                                  null,
                                  2
                                ),
                                'Provisioning JSON copied'
                              )
                            }
                          >
                            Bundle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-6">No charge points found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* OCPI & MQTT */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">OCPI Peers</h3>
                  <span className="text-sm text-muted">({ocpiPeers.length})</span>
                </div>
                <ul className="divide-y divide-border">
                  {ocpiPeers.map((p) => (
                    <li key={p.id} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.id}</div>
                        <div className="text-xs text-muted">Last sync: {p.lastSync}</div>
                      </div>
                      <span
                        className={`pill ${
                          p.status === 'Connected'
                            ? 'approved'
                            : p.status === 'Pending'
                            ? 'pending'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </li>
                  ))}
                  {ocpiPeers.length === 0 && (
                    <li className="py-4 text-center text-muted">No peers found.</li>
                  )}
                </ul>
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">MQTT Broker</h3>
                </div>
                <div className="text-sm text-muted">Topics: {mqttTopics}</div>
                <div className="text-sm text-muted">Rate: {mqttRate}</div>
                <div className="mt-2">
                  <span className={`pill ${mqttStatus === 'Online' ? 'approved' : mqttStatus === 'Warning' ? 'pending' : 'bg-rose-100 text-rose-700'}`}>
                    {mqttStatus === 'Online' ? 'Healthy' : mqttStatus}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
