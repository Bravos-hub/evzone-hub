import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Partners — Roaming partners directory (OCPI peers)
   RBAC: Platform admins and operators
───────────────────────────────────────────────────────────────────────────── */

type PartnerStatus = 'Connected' | 'Pending' | 'Error'
type PartnerRole = 'CPO' | 'EMSP'
type OCPIModule = 'Locations' | 'Sessions' | 'CDRs' | 'Tariffs'

interface Partner {
  id: string
  name: string
  role: PartnerRole
  status: PartnerStatus
  modules: OCPIModule[]
  version: string
  endpoint?: string
  lastSync?: string
}

const MOCK_PARTNERS: Partner[] = [
  { id: 'p-001', name: 'GridRoam', role: 'EMSP', status: 'Connected', modules: ['Locations', 'Sessions', 'CDRs'], version: 'OCPI 2.2.1', endpoint: 'https://api.gridroam.com/ocpi', lastSync: '2025-10-28 14:30' },
  { id: 'p-002', name: 'ChargeNet', role: 'CPO', status: 'Pending', modules: ['Locations'], version: 'OCPI 2.2.1', endpoint: 'https://api.chargenet.io/ocpi' },
  { id: 'p-003', name: 'OpenWatt', role: 'CPO', status: 'Error', modules: ['Locations', 'CDRs'], version: 'OCPI 2.1.1', endpoint: 'https://api.openwatt.eu/ocpi', lastSync: '2025-10-25 09:15' },
  { id: 'p-004', name: 'VoltWave', role: 'EMSP', status: 'Connected', modules: ['Locations', 'Sessions', 'Tariffs', 'CDRs'], version: 'OCPI 2.2.1', endpoint: 'https://api.voltwave.net/ocpi', lastSync: '2025-10-28 15:00' },
]

export function Partners() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'protocols', 'view')
  const canManage = hasPermission(role, 'protocols', 'manage')

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [partnerRole, setPartnerRole] = useState('All')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const filtered = useMemo(() =>
    MOCK_PARTNERS
      .filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
      .filter(p => status === 'All' || p.status === status)
      .filter(p => partnerRole === 'All' || p.role === partnerRole)
      .filter(p => moduleFilter === 'All' || p.modules.includes(moduleFilter as OCPIModule))
  , [q, status, partnerRole, moduleFilter])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Partners.</div>
  }

  return (
    <div className="space-y-6">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* Header actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Roaming Partners</h2>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => toast('Add partner (demo)')} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">
              Add Partner
            </button>
            <a href="/settings" className="px-4 py-2 rounded-lg border border-border hover:bg-muted">Settings</a>
          </div>
        )}
      </div>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-4 gap-3">
        <label className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search partners" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-subtle">Status</span>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
            {['All', 'Connected', 'Pending', 'Error'].map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-subtle">Role</span>
          <select value={partnerRole} onChange={e => setPartnerRole(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
            {['All', 'CPO', 'EMSP'].map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-subtle">Module</span>
          <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
            {['All', 'Locations', 'Sessions', 'CDRs', 'Tariffs'].map(o => <option key={o}>{o}</option>)}
          </select>
        </label>
      </section>

      {/* Partner cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <div key={p.id} className="rounded-xl bg-surface border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold truncate pr-2">{p.name}</div>
              <StatusPill status={p.status} />
            </div>
            <div className="mt-1 text-xs text-subtle">{p.role} • {p.version}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.modules.map(m => (
                <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border">{m}</span>
              ))}
            </div>
            {p.lastSync && (
              <div className="mt-3 text-xs text-subtle">Last sync: {p.lastSync}</div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => setSelectedPartner(p)} className="text-accent text-sm hover:underline flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 10-7.07-7.07L11 4" /><path d="M14 11a5 5 0 01-7.07 0L4.1 8.17a5 5 0 017.07-7.07L13 3" /></svg>
                View
              </button>
              {canManage && (
                <button onClick={() => toast(`Edit ${p.name} (demo)`)} className="text-subtle text-sm hover:text-accent">Edit</button>
              )}
            </div>
          </div>
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-subtle">
          No partners match your filters.{' '}
          {canManage && (
            <button onClick={() => toast('Add partner (demo)')} className="text-accent hover:underline">Add a partner</button>
          )}
        </div>
      )}

      {/* Partner detail drawer */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setSelectedPartner(null)} />
          <div className="w-full max-w-lg bg-surface border-l border-border shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedPartner.name}</h3>
              <button onClick={() => setSelectedPartner(null)} className="px-3 py-1 rounded border border-border hover:bg-muted">Close</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-subtle">Status</div>
                  <StatusPill status={selectedPartner.status} />
                </div>
                <div>
                  <div className="text-subtle">Role</div>
                  <div className="font-medium">{selectedPartner.role}</div>
                </div>
                <div>
                  <div className="text-subtle">OCPI Version</div>
                  <div className="font-medium">{selectedPartner.version}</div>
                </div>
                <div>
                  <div className="text-subtle">Last Sync</div>
                  <div className="font-medium">{selectedPartner.lastSync || '—'}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-subtle mb-2">Endpoint</div>
                <code className="text-xs bg-muted px-2 py-1 rounded block break-all">{selectedPartner.endpoint}</code>
              </div>

              <div>
                <div className="text-sm text-subtle mb-2">Enabled Modules</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.modules.map(m => (
                    <span key={m} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">{m}</span>
                  ))}
                </div>
              </div>

              {canManage && (
                <div className="border-t border-border pt-4 flex gap-2">
                  <button onClick={() => toast('Sync triggered (demo)')} className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">
                    Sync Now
                  </button>
                  <button onClick={() => toast('Test connection (demo)')} className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted">
                    Test Connection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: PartnerStatus }) {
  const colors: Record<PartnerStatus, string> = {
    Connected: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    Error: 'bg-rose-100 text-rose-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status]}`}>{status}</span>
}

export default Partners

