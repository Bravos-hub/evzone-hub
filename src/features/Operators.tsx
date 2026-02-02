import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useUsers, useUpdateUser } from '@/modules/auth/hooks/useUsers'
import { getErrorMessage } from '@/core/api/errors'
import type { User } from '@/core/api/types'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

/* ─────────────────────────────────────────────────────────────────────────────
   Operators — Owner's operator management
   RBAC: Owners, Platform admins
───────────────────────────────────────────────────────────────────────────── */

type OperatorStatus = 'Active' | 'Suspended' | 'Invited' | 'Pending' | 'Inactive'

interface Operator {
  id: string
  name: string
  email?: string
  phone?: string
  role: string
  status: OperatorStatus
  region?: string
  sites: number
  lastSeen?: string
}

const isOperatorRole = (role?: string) => {
  if (!role) return false
  return role.includes('OPERATOR')
}

const mapStatus = (status?: User['status']): OperatorStatus => {
  switch (status) {
    case 'Active':
      return 'Active'
    case 'Suspended':
      return 'Suspended'
    case 'Invited':
      return 'Invited'
    case 'Pending':
      return 'Pending'
    case 'Inactive':
    default:
      return 'Inactive'
  }
}

export function Operators() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'STATION_OWNER'
  const canView = hasPermission(role, 'team', 'view')
  const canManage = hasPermission(role, 'team', 'edit')

  const { data: users = [], isLoading, error } = useUsers()
  const updateUser = useUpdateUser()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [region, setRegion] = useState('All')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const operators = useMemo<Operator[]>(() => {
    return users
      .filter((u) => isOperatorRole(u.role))
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: mapStatus(u.status),
        region: u.region,
        sites: u.assignedStations?.length || 0,
        lastSeen: u.lastSeen,
      }))
  }, [users])

  const filtered = useMemo(() =>
    operators
      .filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()) || (r.email || '').toLowerCase().includes(q.toLowerCase()))
      .filter(r => status === 'All' || r.status === status)
      .filter(r => region === 'All' || r.region === region)
  , [operators, q, status, region])

  const toggle = (op: Operator) => {
    const newStatus = op.status === 'Active' ? 'Suspended' : 'Active'
    updateUser.mutate(
      { id: op.id, data: { status: newStatus } },
      {
        onSuccess: () => toast(`${newStatus === 'Active' ? 'Resumed' : 'Suspended'} ${op.name}`),
        onError: (err) => toast(getErrorMessage(err)),
      }
    )
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Operators.</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {getErrorMessage(error)}
        </div>
      )}
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Operators', value: filtered.length },
          { label: 'Active', value: filtered.filter(o => o.status === 'Active').length },
          { label: 'Assigned Sites', value: filtered.reduce((sum, o) => sum + o.sites, 0) },
          { label: 'Invited', value: filtered.filter(o => o.status === 'Invited').length },
        ].map(k => (
          <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-4 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search operators" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['All', 'Active', 'Suspended', 'Invited', 'Pending', 'Inactive'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={region} onChange={e => setRegion(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['All', ...Array.from(new Set(operators.map(o => o.region).filter(Boolean)))].map(o => <option key={o}>{o}</option>)}
        </select>
      </section>

      {/* Actions */}
      {canManage && (
        <div className="flex justify-end">
          <button onClick={() => toast('Invite Operator modal would open')} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">
            Invite Operator
          </button>
        </div>
      )}

      {/* Table */}
      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-subtle">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Operator</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Region</th>
              <th className="px-4 py-3 text-left font-medium">Sites</th>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-left font-medium">Last Seen</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{r.role}</td>
                <td className="px-4 py-3">{r.region || '—'}</td>
                <td className="px-4 py-3">{r.sites}</td>
                <td className="px-4 py-3 text-subtle">{r.email || r.phone || '—'}</td>
                <td className="px-4 py-3 text-subtle">{r.lastSeen ? new Date(r.lastSeen).toLocaleString() : '—'}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                {canManage && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => toast(`View report for ${r.name}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Report</button>
                      {r.status === 'Active' && (
                        <button onClick={() => toggle(r)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 5h3v14H8zM13 5h3v14h-3z" /></svg>
                          Suspend
                        </button>
                      )}
                      {r.status === 'Suspended' && (
                        <button onClick={() => toggle(r)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          Resume
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <div className="p-8">
            <TextSkeleton lines={2} centered />
          </div>
        )}
        {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No operators match your filters.</div>}
      </section>
    </div>
  )
}

function StatusPill({ status }: { status: OperatorStatus }) {
  const colors: Record<OperatorStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Suspended: 'bg-rose-100 text-rose-700',
    Invited: 'bg-blue-100 text-blue-700',
    Pending: 'bg-amber-100 text-amber-700',
    Inactive: 'bg-gray-100 text-gray-600',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default Operators


