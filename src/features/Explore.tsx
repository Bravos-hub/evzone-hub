import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'

type Station = {
  id: string
  name: string
  region: string
  city: string
  status: 'Online' | 'Offline' | 'Degraded'
}

const mockStations: Station[] = [
  { id: 'ST-100', name: 'Central Hub', region: 'AFRICA', city: 'Kampala', status: 'Online' },
  { id: 'ST-220', name: 'Tech Park', region: 'AFRICA', city: 'Nairobi', status: 'Degraded' },
  { id: 'ST-330', name: 'Berlin Mitte', region: 'EUROPE', city: 'Berlin', status: 'Online' },
  { id: 'ST-440', name: 'Downtown NYC', region: 'AMERICAS', city: 'New York', status: 'Offline' },
]

export function Explore() {
  const [region, setRegion] = useState<'ALL' | string>('ALL')
  const [status, setStatus] = useState<'All' | Station['status']>('All')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return mockStations
      .filter((s) => (region === 'ALL' ? true : s.region === region))
      .filter((s) => (status === 'All' ? true : s.status === status))
      .filter((s) => (q ? (s.name + ' ' + s.city + ' ' + s.id).toLowerCase().includes(q.toLowerCase()) : true))
  }, [region, status, q])

  return (
    <DashboardLayout pageTitle="Explore">
      <div className="space-y-4">
        <div className="card grid md:grid-cols-4 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search station/name/id" className="input md:col-span-2" />
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="select">
            {['ALL', 'AFRICA', 'EUROPE', 'AMERICAS', 'ASIA', 'MIDDLE_EAST'].map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All regions' : r}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as Station['status'] | 'All')} className="select">
            {['All', 'Online', 'Offline', 'Degraded'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((s) => (
            <div key={s.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted">{s.id}</div>
                  <div className="text-lg font-semibold">{s.name}</div>
                </div>
                <span
                  className={`pill ${
                    s.status === 'Online' ? 'approved' : s.status === 'Degraded' ? 'pending' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <div className="text-sm text-muted">
                {s.city} • {s.region}
              </div>
              <button className="btn secondary" onClick={() => alert('Open station (mock)')}>
                Open
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

