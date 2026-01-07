import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type Endpoint = {
  id: string
  site: string
  make: string
  model: string
  ver: '1.6J' | '2.0.1'
  vendor: string
  fw: string
  status: 'Online' | 'Warning' | 'Offline'
  hb: string
  chargeBoxId: string
  password: string
  connectors: Array<{ id: number; t: string; kw: number; status: string }>
}

const ocppEndpoints: Endpoint[] = [
  {
    id: 'CP-A1',
    site: 'Central Hub',
    make: 'ABB',
    model: 'Terra 54',
    ver: '1.6J',
    vendor: 'ABB',
    fw: 'v2.1.0',
    status: 'Online',
    hb: '11:42',
    chargeBoxId: 'CP-A1',
    password: 'demo_pw_A',
    connectors: [
      { id: 1, t: 'CCS2', kw: 60, status: 'Available' },
      { id: 2, t: 'Type 2', kw: 22, status: 'Available' },
    ],
  },
  {
    id: 'CP-B4',
    site: 'Airport East',
    make: 'Delta',
    model: 'DC Wall 25',
    ver: '1.6J',
    vendor: 'Delta',
    fw: 'v1.9.3',
    status: 'Warning',
    hb: '11:34',
    chargeBoxId: 'CP-B4',
    password: 'demo_pw_B',
    connectors: [{ id: 1, t: 'CHAdeMO', kw: 50, status: 'Charging' }],
  },
  {
    id: 'CP-C2',
    site: 'Tech Park',
    make: 'Huawei',
    model: 'FusionCharge',
    ver: '2.0.1',
    vendor: 'Huawei',
    fw: 'v3.0.0',
    status: 'Offline',
    hb: '10:01',
    chargeBoxId: 'CP-C2',
    password: 'demo_pw_C',
    connectors: [{ id: 1, t: 'CCS2', kw: 120, status: 'Available' }],
  },
]

const ocpiPeers = [
  { id: 'Hubject', status: 'Connected', lastSync: '10m ago' },
  { id: 'Gireve', status: 'Connected', lastSync: '32m ago' },
  { id: 'e-Clearing', status: 'Degraded', lastSync: '1h ago' },
]

const mqttStats = { topics: 45, rate: '12.5K/min', status: 'Healthy' }

export function Protocols() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'protocolsConsole')

  const [q, setQ] = useState('')
  const [ver, setVer] = useState<'All' | '1.6J' | '2.0.1'>('All')
  const [make, setMake] = useState<'All' | string>('All')

  const rows = useMemo(() => {
    return ocppEndpoints
      .map((r) => ({
        ...r,
        maxKw: Math.max(...(r.connectors || []).map((c) => c.kw || 0), 0),
        activeSessions: (r.connectors || []).filter((c) => c.status === 'Charging').length,
      }))
      .filter((r) => (q ? (r.id + ' ' + r.site + ' ' + r.make + ' ' + r.model).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (ver === 'All' ? true : r.ver === ver))
      .filter((r) => (make === 'All' ? true : r.make === make))
  }, [q, ver, make])

  function csmsUrlFor(v: Endpoint['ver']) {
    return `wss://csms.evzone.example/ocpp/${v === '1.6J' ? '1.6' : '2.0.1'}`
  }

  function copy(text: string, msg: string) {
    navigator?.clipboard?.writeText?.(text)
    alert(msg)
  }

  return (
    <DashboardLayout pageTitle="Protocols Console">
      <div className="space-y-4">
        {/* Filters */}
        <div className="card grid md:grid-cols-5 gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search charger/site/make/model" className="input md:col-span-2" />
          <select value={ver} onChange={(e) => setVer(e.target.value as any)} className="select">
            {['All', '1.6J', '2.0.1'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select value={make} onChange={(e) => setMake(e.target.value)} className="select">
            {['All', 'ABB', 'Delta', 'Huawei', 'Siemens', 'StarCharge'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <div className="text-sm text-muted self-center">{rows.length} result(s)</div>
        </div>

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
                      <button className="btn secondary" onClick={() => copy(csmsUrlFor(r.ver), 'CSMS URL copied')}>
                        CSMS URL
                      </button>
                      <button className="btn secondary" onClick={() => copy(r.chargeBoxId, 'ChargeBoxId copied')}>
                        ID
                      </button>
                      <button className="btn secondary" onClick={() => copy(r.password, 'Password copied')}>
                        Password
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() =>
                          copy(
                            JSON.stringify(
                              {
                                CSMS: csmsUrlFor(r.ver),
                                ChargeBoxId: r.chargeBoxId,
                                Password: r.password,
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
                      p.status === 'Connected' ? 'approved' : p.status === 'Degraded' ? 'pending' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">MQTT Broker</h3>
            </div>
            <div className="text-sm text-muted">Topics: {mqttStats.topics}</div>
            <div className="text-sm text-muted">Rate: {mqttStats.rate}</div>
            <div className="mt-2">
              <span className="pill approved">{mqttStats.status}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

