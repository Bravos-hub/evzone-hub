import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Parking — Site Owner parking bay management
   RBAC: Site Owners, Platform admins
───────────────────────────────────────────────────────────────────────────── */

type ParkingStatus = 'Active' | 'Maintenance' | 'Reserved' | 'Inactive'

interface ParkingBay {
  id: string
  site: string
  bay: string
  type: 'EV Charging' | 'Regular' | 'Handicap' | 'VIP'
  status: ParkingStatus
  charger?: string
  rate: number
  occupancy: number
  lastUsed: string
}

const MOCK_BAYS: ParkingBay[] = [
  { id: 'PK-001', site: 'City Mall Roof', bay: 'A-01', type: 'EV Charging', status: 'Active', charger: 'CP-A1', rate: 2.50, occupancy: 78, lastUsed: '2025-10-29 10:15' },
  { id: 'PK-002', site: 'City Mall Roof', bay: 'A-02', type: 'EV Charging', status: 'Active', charger: 'CP-A2', rate: 2.50, occupancy: 65, lastUsed: '2025-10-29 09:42' },
  { id: 'PK-003', site: 'City Mall Roof', bay: 'B-01', type: 'Regular', status: 'Active', rate: 1.00, occupancy: 82, lastUsed: '2025-10-29 11:05' },
  { id: 'PK-004', site: 'Business Park A', bay: 'C-01', type: 'EV Charging', status: 'Maintenance', charger: 'CP-C1', rate: 3.00, occupancy: 0, lastUsed: '2025-10-28 18:30' },
  { id: 'PK-005', site: 'Business Park A', bay: 'C-02', type: 'Handicap', status: 'Reserved', rate: 0.00, occupancy: 45, lastUsed: '2025-10-29 08:15' },
  { id: 'PK-006', site: 'Airport Long-Stay', bay: 'D-01', type: 'VIP', status: 'Active', rate: 5.00, occupancy: 55, lastUsed: '2025-10-29 07:00' },
]

export function Parking() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'SITE_OWNER'
  const canView = hasPermission(role, 'parking', 'view')
  const canEdit = hasPermission(role, 'parking', 'edit')

  const [bays, setBays] = useState<ParkingBay[]>(MOCK_BAYS)
  const [site, setSite] = useState('All')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [q, setQ] = useState('')
  const [ack, setAck] = useState('')

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBay, setNewBay] = useState<Partial<ParkingBay>>({
    site: 'City Mall Roof',
    type: 'EV Charging',
    status: 'Active',
    rate: 2.50,
  })

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 3000) }

  const filtered = useMemo(() =>
    bays
      .filter(r => site === 'All' || r.site === site)
      .filter(r => type === 'All' || r.type === type)
      .filter(r => status === 'All' || r.status === status)
      .filter(r => !q || (r.id + ' ' + r.bay + ' ' + r.site).toLowerCase().includes(q.toLowerCase()))
    , [bays, site, type, status, q])

  const kpis = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter(b => b.status === 'Active').length,
    evBays: filtered.filter(b => b.type === 'EV Charging').length,
    avgOccupancy: Math.round(filtered.reduce((sum, b) => sum + b.occupancy, 0) / (filtered.length || 1)),
  }), [filtered])

  const handleAddBay = () => {
    if (!newBay.bay || !newBay.site) {
      toast('Please fill in required fields (Bay Name & Site)')
      return
    }

    const id = `PK-${String(bays.length + 1).padStart(3, '0')}`
    const entry: ParkingBay = {
      id,
      site: newBay.site!,
      bay: newBay.bay!,
      type: (newBay.type as any) || 'Regular',
      status: 'Active',
      charger: newBay.charger,
      rate: Number(newBay.rate) || 0,
      occupancy: 0,
      lastUsed: 'Never',
    }

    setBays([entry, ...bays])
    setShowAddModal(false)
    setNewBay({ site: 'City Mall Roof', type: 'EV Charging', status: 'Active', rate: 2.50 })
    toast(`Successfully added new bay ${id}`)
  }

  const handleDeleteBay = (id: string) => {
    if (confirm(`Are you sure you want to delete bay ${id}?`)) {
      setBays(bays.filter(b => b.id !== id))
      toast(`Deleted bay ${id}`)
    }
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Parking.</div>
  }

  return (
    <DashboardLayout pageTitle="Site Owner — Parking">
      <div className="space-y-6">
        {ack && (
          <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="rounded-lg bg-accent text-white px-6 py-3 shadow-lg flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              <span className="font-medium">{ack}</span>
            </div>
          </div>
        )}

        {/* KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm transition-all hover:shadow-md">
            <div className="text-sm text-subtle">Total Bays</div>
            <div className="mt-2 text-2xl font-bold">{kpis.total}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm transition-all hover:shadow-md text-emerald-600">
            <div className="text-sm text-subtle">Active</div>
            <div className="mt-2 text-2xl font-bold">{kpis.active}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm transition-all hover:shadow-md text-accent">
            <div className="text-sm text-subtle">EV Charging Bays</div>
            <div className="mt-2 text-2xl font-bold">{kpis.evBays}</div>
          </div>
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm transition-all hover:shadow-md">
            <div className="text-sm text-subtle">Avg Occupancy</div>
            <div className="mt-2 text-2xl font-bold">{kpis.avgOccupancy}%</div>
          </div>
        </section>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 w-full">
            <label className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search bay / site" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent bg-background" />
            </label>
            <select value={site} onChange={e => setSite(e.target.value)} className="select bg-background">
              {['All', 'City Mall Roof', 'Business Park A', 'Airport Long-Stay'].map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)} className="select bg-background">
              {['All', 'EV Charging', 'Regular', 'Handicap', 'VIP'].map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)} className="select bg-background">
              {['All', 'Active', 'Maintenance', 'Reserved', 'Inactive'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-all shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Add New Bay
            </button>
          )}
        </div>

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 border-b border-border text-subtle font-semibold">
                <tr>
                  <th className="px-5 py-4 text-left">ID</th>
                  <th className="px-5 py-4 text-left">Site</th>
                  <th className="px-5 py-4 text-left">Bay</th>
                  <th className="px-5 py-4 text-left">Type</th>
                  <th className="px-5 py-4 text-left">Charger</th>
                  <th className="px-5 py-4 text-right">Rate/hr</th>
                  <th className="px-5 py-4 text-right">Occupancy</th>
                  <th className="px-5 py-4 text-left">Last Used</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  {canEdit && <th className="px-5 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-accent">{r.id}</td>
                    <td className="px-5 py-4 font-medium">{r.site}</td>
                    <td className="px-5 py-4">{r.bay}</td>
                    <td className="px-5 py-4"><TypePill type={r.type} /></td>
                    <td className="px-5 py-4 text-subtle">{r.charger || '—'}</td>
                    <td className="px-5 py-4 text-right font-medium">${r.rate.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-subtle">
                        <span>{r.occupancy}%</span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${r.occupancy}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-subtle">{r.lastUsed}</td>
                    <td className="px-5 py-4"><StatusPill status={r.status} /></td>
                    {canEdit && (
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button onClick={() => toast(`Editing ${r.id} functionality coming soon`)} className="p-1.5 rounded-lg border border-border hover:bg-muted text-subtle hover:text-foreground transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteBay(r.id)} className="p-1.5 rounded-lg border border-border hover:bg-rose-50 hover:text-rose-600 border-rose-100/0 text-subtle transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-subtle">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="text-subtle font-medium text-lg">No parking bays found</div>
              <p className="text-subtle/70 max-w-xs">Try adjusting your filters or add a new bay to this site.</p>
            </div>
          )}
        </section>
      </div>

      {/* Add Bay Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border p-8 animate-in zoom-in-95 fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add New Parking Bay</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors text-subtle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Bay Name/Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. A-05"
                    value={newBay.bay || ''}
                    onChange={e => setNewBay({ ...newBay, bay: e.target.value })}
                    className="w-full rounded-xl border border-border p-3 outline-none focus:ring-2 focus:ring-accent bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Associated Site *</label>
                  <select
                    value={newBay.site || ''}
                    onChange={e => setNewBay({ ...newBay, site: e.target.value })}
                    className="w-full rounded-xl border border-border p-3 outline-none focus:ring-2 focus:ring-accent bg-background"
                  >
                    {['City Mall Roof', 'Business Park A', 'Airport Long-Stay'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Bay Type</label>
                  <select
                    value={newBay.type || 'Regular'}
                    onChange={e => setNewBay({ ...newBay, type: e.target.value as any })}
                    className="w-full rounded-xl border border-border p-3 outline-none focus:ring-2 focus:ring-accent bg-background"
                  >
                    {['EV Charging', 'Regular', 'Handicap', 'VIP'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Base Rate ($/hr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBay.rate || 0}
                    onChange={e => setNewBay({ ...newBay, rate: parseFloat(e.target.value) })}
                    className="w-full rounded-xl border border-border p-3 outline-none focus:ring-2 focus:ring-accent bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Charger Unit (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CP-A1"
                  value={newBay.charger || ''}
                  onChange={e => setNewBay({ ...newBay, charger: e.target.value })}
                  className="w-full rounded-xl border border-border p-3 outline-none focus:ring-2 focus:ring-accent bg-background"
                />
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-border font-bold hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBay}
                  className="flex-1 px-6 py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-md active:scale-95"
                >
                  Create Bay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function TypePill({ type }: { type: string }) {
  const colors: Record<string, string> = {
    'EV Charging': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    'Regular': 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400',
    'Handicap': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    'VIP': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  }
  return <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${colors[type] || 'bg-gray-100 text-gray-600'}`}>{type}</span>
}

function StatusPill({ status }: { status: ParkingStatus }) {
  const colors: Record<ParkingStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    Maintenance: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    Reserved: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    Inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-emerald-500 animate-pulse' : status === 'Maintenance' ? 'bg-amber-500' : 'bg-subtle'}`} />
      <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${colors[status]}`}>{status}</span>
    </div>
  )
}

export default Parking

