import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useOpenAdrEvents } from '@/modules/integrations/useOpenAdr'
import { getErrorMessage } from '@/core/api/errors'
import { LoadingRow } from '@/ui/components/SkeletonCards'

/* ─────────────────────────────────────────────────────────────────────────────
   OpenADR Events — Demand Response management
   RBAC: Platform admins only
───────────────────────────────────────────────────────────────────────────── */

type EventStatus = 'Pending' | 'Active' | 'Completed' | 'Cancelled'
type SignalType = 'LOAD' | 'PRICE'

interface DREvent {
  id: string
  program: string
  signal: SignalType
  level: 'Low' | 'Moderate' | 'High'
  start: string
  end: string
  sites: number
  status: EventStatus
}

export function OpenADR() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'protocols', 'view')
  const canManage = hasPermission(role, 'protocols', 'manage')

  const [q, setQ] = useState('')
  const [program, setProgram] = useState('All')
  const [status, setStatus] = useState('All')
  const [signal, setSignal] = useState('All')
  const [from, setFrom] = useState('2025-10-01')
  const [to, setTo] = useState('2025-10-31')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const { data: eventsData = [], isLoading, error } = useOpenAdrEvents({ from, to })

  const events = useMemo(() => {
    const raw = Array.isArray(eventsData) ? eventsData : (eventsData as any)?.data || []
    return raw.map((e: any) => ({
      id: e.id,
      program: e.program || e.programName || '—',
      signal: (e.signal || e.signalType || 'LOAD') as SignalType,
      level: (e.level || e.severity || 'Low') as DREvent['level'],
      start: e.start || e.startAt || e.startsAt || '—',
      end: e.end || e.endAt || e.endsAt || '—',
      sites: e.sites ?? e.siteCount ?? 0,
      status: (e.status || 'Pending') as EventStatus,
    }))
  }, [eventsData])

  const kpis = useMemo(() => {
    const programs = new Set(events.map(e => e.program)).size
    const active = events.filter(e => e.status === 'Active').length
    const pending = events.filter(e => e.status === 'Pending').length
    const sites = events.reduce((sum, e) => sum + (e.sites || 0), 0)
    return [
      { label: 'Programs', value: String(programs) },
      { label: 'Active events', value: String(active) },
      { label: 'Pending events', value: String(pending) },
      { label: 'Sites subscribed', value: String(sites) },
      { label: 'Opt-outs (24h)', value: '0' },
    ]
  }, [events])

  const filtered = useMemo(() =>
    events
      .filter(r => !q || (r.id + ' ' + r.program).toLowerCase().includes(q.toLowerCase()))
      .filter(r => program === 'All' || r.program === program)
      .filter(r => status === 'All' || r.status === status)
      .filter(r => signal === 'All' || r.signal === signal)
      .filter(r => new Date(r.start) >= new Date(from) && new Date(r.end) <= new Date(to + 'T23:59:59'))
  , [events, q, program, status, signal, from, to])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view OpenADR Events.</div>
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
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-7 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search event / program" className="input pl-9" />
        </label>
        <select value={program} onChange={e => setProgram(e.target.value)} className="select">
          {['All', 'FastDR', 'PeakSaver', 'PVShift'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={signal} onChange={e => setSignal(e.target.value)} className="select">
          {['All', 'LOAD', 'PRICE'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="select">
          {['All', 'Pending', 'Active', 'Completed', 'Cancelled'].map(o => <option key={o}>{o}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input" />
      </section>

      {/* Actions */}
      {canManage && (
        <section className="rounded-xl bg-surface border border-border p-4 flex flex-wrap items-center gap-3">
          <button onClick={() => toast('Created new event (demo)')} className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Create Event
          </button>
          <button onClick={() => toast('Published next event (demo)')} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">Publish Next</button>
          <button onClick={() => toast('Refreshed (demo)')} className="ml-auto px-4 py-2 rounded-lg border border-border hover:bg-muted">Refresh</button>
        </section>
      )}

      {/* Table */}
      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-subtle">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Event</th>
              <th className="px-4 py-3 text-left font-medium">Program</th>
              <th className="px-4 py-3 text-left font-medium">Signal</th>
              <th className="px-4 py-3 text-left font-medium">Level</th>
              <th className="px-4 py-3 text-left font-medium">Start</th>
              <th className="px-4 py-3 text-left font-medium">End</th>
              <th className="px-4 py-3 text-left font-medium">Sites</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <LoadingRow colSpan={canManage ? 9 : 8} />}
            {!isLoading && filtered.map(r => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{r.id}</td>
                <td className="px-4 py-3">{r.program}</td>
                <td className="px-4 py-3">{r.signal}</td>
                <td className="px-4 py-3">
                  <LevelPill level={r.level} />
                </td>
                <td className="px-4 py-3 text-subtle">{r.start}</td>
                <td className="px-4 py-3 text-subtle">{r.end}</td>
                <td className="px-4 py-3">{r.sites}</td>
                <td className="px-4 py-3">
                  <StatusPill status={r.status} />
                </td>
                {canManage && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {r.status === 'Pending' && (
                        <button onClick={() => toast(`Published ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Publish</button>
                      )}
                      {r.status !== 'Cancelled' && (
                        <button onClick={() => toast(`Cancelled ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Cancel</button>
                      )}
                      <button onClick={() => toast(`Opt-out recorded for ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Opt-out</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && <div className="p-8 text-center text-subtle">No events match your filters.</div>}
      </section>
    </div>
  )
}

function StatusPill({ status }: { status: EventStatus }) {
  const colors: Record<EventStatus, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-gray-100 text-gray-700',
    Completed: 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-rose-100 text-rose-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

function LevelPill({ level }: { level: 'Low' | 'Moderate' | 'High' }) {
  const colors = {
    Low: 'bg-gray-100 text-gray-600',
    Moderate: 'bg-amber-100 text-amber-700',
    High: 'bg-rose-100 text-rose-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[level]}`}>{level}</span>
}

export default OpenADR

