import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Utility Dashboard — Grid signals, price & carbon forecast, DR tools
   RBAC: Platform admins only
───────────────────────────────────────────────────────────────────────────── */

interface GridEvent {
  id: string
  type: 'OpenADR' | 'Utility Notice' | 'Manual'
  level: 'HIGH' | 'MED' | 'LOW'
  start: string
  end: string
  status: 'Active' | 'Ended' | 'Scheduled'
}

interface SiteRow {
  id: string
  name: string
  city: string
  headroom: number
  enrolled: boolean
  status: 'Open' | 'Throttled' | 'Offline'
}

const KPIS = [
  { label: 'Grid price now', value: '$0.23/kWh' },
  { label: 'Carbon intensity', value: '412 gCO₂/kWh' },
  { label: 'DR events today', value: '2' },
  { label: 'Peak (today)', value: '1.42 MW' },
  { label: 'Headroom saved (24h)', value: '12.4 MWh' },
]

const MOCK_EVENTS: GridEvent[] = [
  { id: 'ADR-2411-07', type: 'OpenADR', level: 'HIGH', start: '2025-11-05 12:30', end: '2025-11-05 14:30', status: 'Active' },
  { id: 'UTIL-2411-02', type: 'Utility Notice', level: 'MED', start: '2025-11-04 18:00', end: '2025-11-04 20:00', status: 'Ended' },
]

const MOCK_SITES: SiteRow[] = [
  { id: 'SITE-401', name: 'Central Hub', city: 'Kampala', headroom: 45, enrolled: true, status: 'Open' },
  { id: 'SITE-402', name: 'Airport East', city: 'Kampala', headroom: 18, enrolled: true, status: 'Throttled' },
  { id: 'SITE-403', name: 'Business Park A', city: 'Wuxi', headroom: 72, enrolled: false, status: 'Open' },
]

const TARIFF_MAPPINGS = [
  { utility: 'Umeme Time‑of‑Use', plan: 'Retail TOU A', bands: '3 bands' },
  { utility: 'Umeme Peak', plan: 'Demand Charge', bands: '1 band' },
]

export function Utility() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'protocols', 'view')
  const canManage = hasPermission(role, 'protocols', 'manage')

  const [region, setRegion] = useState('All')
  const [utility, setUtility] = useState('All')
  const [gran, setGran] = useState('1h')
  const [signal, setSignal] = useState('All')
  const [q, setQ] = useState('')
  const [sites, setSites] = useState(MOCK_SITES)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const toggleEnroll = (id: string) => {
    setSites(list => list.map(s => s.id === id ? { ...s, enrolled: !s.enrolled } : s))
  }

  const sitesFiltered = useMemo(() =>
    sites
      .filter(s => region === 'All' || s.city === region)
      .filter(s => !q || (s.id + s.name + s.city).toLowerCase().includes(q.toLowerCase()))
  , [sites, region, q])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Utility Dashboard.</div>
  }

  return (
    <div className="space-y-6">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-7 gap-3">
        <label className="grid gap-1">
          <span className="text-xs text-subtle">Region</span>
          <select value={region} onChange={e => setRegion(e.target.value)} className="select">
            <option>All</option><option>Kampala</option><option>Wuxi</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-subtle">Utility</span>
          <select value={utility} onChange={e => setUtility(e.target.value)} className="select">
            <option>All</option><option>Umeme</option><option>KPLC</option><option>TANESCO</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-subtle">Granularity</span>
          <select value={gran} onChange={e => setGran(e.target.value)} className="select">
            {['15m', '1h', '1d'].map(x => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-subtle">Signal</span>
          <select value={signal} onChange={e => setSignal(e.target.value)} className="select">
            {['All', 'OpenADR', 'Utility Notice', 'Manual'].map(x => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="grid gap-1 md:col-span-2">
          <span className="text-xs text-subtle">Search</span>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-3.5-3.5" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Site or city" className="input pl-9" />
          </div>
        </label>
        <div className="flex items-end">
          <button onClick={() => toast('Exported CSV (demo)')} className="px-3 py-2 rounded-lg border border-border hover:bg-muted w-full flex items-center gap-2 justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
            Export
          </button>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {KPIS.map(k => (
          <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Forecasts placeholders */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22" /><path d="M17 5a4 4 0 00-4-2H9a3 3 0 000 6h6a3 3 0 010 6H9a4 4 0 01-4-2" /></svg>
              Price Forecast ({gran})
            </h3>
            <button onClick={() => toast('Export price (demo)')} className="text-sm text-accent hover:underline">Export</button>
          </div>
          <div className="h-56 rounded-lg bg-muted border border-border grid place-items-center text-subtle">
            Line Chart • $/kWh
          </div>
        </div>
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C7 2 2 7 2 12s5 10 10 10 10-5 10-10C19 12 12 2 12 2z" /></svg>
              Carbon Forecast ({gran})
            </h3>
            <button onClick={() => toast('Export carbon (demo)')} className="text-sm text-accent hover:underline">Export</button>
          </div>
          <div className="h-56 rounded-lg bg-muted border border-border grid place-items-center text-subtle">
            Area Chart • gCO₂/kWh
          </div>
        </div>
      </section>

      {/* Grid signals & DR actions */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Grid Signals</h2>
            <a href="/openadr" className="text-sm text-accent hover:underline">OpenADR Events</a>
          </div>
          <ul className="divide-y divide-border">
            {MOCK_EVENTS.map(e => (
              <li key={e.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {e.id} • {e.type} •{' '}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      e.level === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                      e.level === 'MED' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}>{e.level}</span>
                  </div>
                  <div className="text-sm text-subtle">{e.start} → {e.end}</div>
                </div>
                <div className="flex items-center gap-2">
                  {e.status === 'Active' ? (
                    <button onClick={() => toast('Paused (demo)')} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Pause</button>
                  ) : (
                    <button onClick={() => toast('Simulated (demo)')} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Simulate</button>
                  )}
                  <button onClick={() => toast('Details (demo)')} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Details</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {canManage && (
          <aside className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Send DR Event (demo)</h3>
            <label className="grid gap-1 text-sm mb-2">
              <span>Level</span>
              <select className="rounded border border-border px-2 py-1"><option>LOW</option><option>MED</option><option>HIGH</option></select>
            </label>
            <label className="grid gap-1 text-sm mb-2">
              <span>From</span>
              <input type="datetime-local" className="rounded border border-border px-2 py-1" />
            </label>
            <label className="grid gap-1 text-sm mb-3">
              <span>To</span>
              <input type="datetime-local" className="rounded border border-border px-2 py-1" />
            </label>
            <button onClick={() => toast('Sent DR event (demo)')} className="w-full px-3 py-2 rounded bg-accent text-white font-medium hover:bg-accent-hover">Send</button>
            <p className="text-xs text-subtle mt-3">Sites obey policy precedence: Manual override → DR event → Exceptions → Schedule.</p>
          </aside>
        )}
      </section>

      {/* Tariff mapping & Sites */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Tariff Mapping</h3>
            <a href="/tariffs" className="text-sm text-accent hover:underline">Manage tariffs</a>
          </div>
          <ul className="divide-y divide-border">
            {TARIFF_MAPPINGS.map((t, i) => (
              <li key={i} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.utility}</div>
                  <div className="text-sm text-subtle">Plan: {t.plan} • {t.bands}</div>
                </div>
                <button onClick={() => toast('Edit (demo)')} className="text-sm text-accent hover:underline">Edit</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Sites</h2>
            <span className="text-sm text-subtle">{sitesFiltered.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-subtle">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Site</th>
                  <th className="px-3 py-2 text-left font-medium">City</th>
                  <th className="px-3 py-2 text-left font-medium">Headroom</th>
                  <th className="px-3 py-2 text-left font-medium">Enrolled</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sitesFiltered.map(s => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.city}</td>
                    <td className="px-3 py-2">{s.headroom} kW</td>
                    <td className="px-3 py-2">{s.enrolled ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'Open' ? 'bg-emerald-100 text-emerald-700' :
                        s.status === 'Throttled' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => toggleEnroll(s.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">{s.enrolled ? 'Unenroll' : 'Enroll'}</button>
                        <button onClick={() => toast('Open site (demo)')} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Open</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Utility

