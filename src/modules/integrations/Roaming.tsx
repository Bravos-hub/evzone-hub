import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Roaming — OCPI Sessions & CDRs
   RBAC: Platform admins only
───────────────────────────────────────────────────────────────────────────── */

type RoamingRole = 'CPO' | 'MSP'
type SessionStatus = 'Completed' | 'Charging' | 'Failed' | 'Refunded'
type CDRStatus = 'Finalized' | 'Sent' | 'Disputed' | 'Voided' | 'Pending'

interface RoamingSession {
  id: string
  role: RoamingRole
  partner: string
  site: string
  cp: string
  start: string
  end: string
  dur: string
  kwh: number
  cur: string
  amt: number
  status: SessionStatus
}

interface RoamingCDR {
  cdr: string
  session: string
  role: RoamingRole
  partner: string
  site: string
  start: string
  end: string
  dur: string
  kwh: number
  cur: string
  amt: number
  tariff: string
  fee: number
  net: number
  status: CDRStatus
}

const MOCK_SESSIONS: RoamingSession[] = [
  { id: 'EVZ-21853', role: 'MSP', partner: 'VoltHub', site: 'Central Hub', cp: 'CP-A1/2', start: '2025-10-29 10:05', end: '2025-10-29 10:41', dur: '36m', kwh: 18.2, cur: 'USD', amt: 5.12, status: 'Completed' },
  { id: 'EVZ-21844', role: 'CPO', partner: 'GreenRoam', site: 'Airport East', cp: 'CP-B4/1', start: '2025-10-29 07:18', end: '2025-10-29 07:29', dur: '11m', kwh: 4.1, cur: 'USD', amt: 1.25, status: 'Failed' },
  { id: 'EVZ-21810', role: 'MSP', partner: 'VoltHub', site: 'Tech Park', cp: 'CP-C2/1', start: '2025-10-28 19:02', end: '2025-10-28 19:40', dur: '38m', kwh: 12.6, cur: 'EUR', amt: 3.80, status: 'Completed' },
]

const MOCK_CDRS: RoamingCDR[] = [
  { cdr: 'CDR-9901', session: 'EVZ-21853', role: 'MSP', partner: 'VoltHub', site: 'Central Hub', start: '2025-10-29 10:05', end: '2025-10-29 10:41', dur: '36m', kwh: 18.2, cur: 'USD', amt: 5.12, tariff: 'Night Saver', fee: 0.15, net: 4.97, status: 'Finalized' },
  { cdr: 'CDR-9899', session: 'EVZ-21844', role: 'CPO', partner: 'GreenRoam', site: 'Airport East', start: '2025-10-29 07:18', end: '2025-10-29 07:29', dur: '11m', kwh: 4.1, cur: 'USD', amt: 1.25, tariff: 'Standard', fee: 0.04, net: 1.21, status: 'Sent' },
  { cdr: 'CDR-9890', session: 'EVZ-21810', role: 'MSP', partner: 'VoltHub', site: 'Tech Park', start: '2025-10-28 19:02', end: '2025-10-28 19:40', dur: '38m', kwh: 12.6, cur: 'EUR', amt: 3.80, tariff: 'Night Saver', fee: 0.11, net: 3.69, status: 'Disputed' },
]

const SESSION_KPIS = [
  { label: 'Partners', value: '22' },
  { label: 'Sessions (30d)', value: '3,420' },
  { label: 'Roaming kWh (30d)', value: '12,840' },
  { label: 'Gross (30d)', value: '$8,920' },
  { label: 'Failures (24h)', value: '7' },
]

const CDR_KPIS = [
  { label: 'CDRs (30d)', value: '3,390' },
  { label: 'Gross (30d)', value: '$8,760' },
  { label: 'Fees (30d)', value: '$420' },
  { label: 'Net (30d)', value: '$8,340' },
  { label: 'Disputes (open)', value: '4' },
]

export function Roaming() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'protocols', 'view')
  const canManage = hasPermission(role, 'protocols', 'manage')

  const [tab, setTab] = useState<'sessions' | 'cdrs'>('sessions')
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [partner, setPartner] = useState('All')
  const [status, setStatus] = useState('All')
  const [fx, setFx] = useState(true)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const sessions = useMemo(() =>
    MOCK_SESSIONS
      .filter(r => !q || (r.id + ' ' + r.partner + ' ' + r.site).toLowerCase().includes(q.toLowerCase()))
      .filter(r => roleFilter === 'All' || r.role === roleFilter)
      .filter(r => partner === 'All' || r.partner === partner)
      .filter(r => status === 'All' || r.status === status)
  , [q, roleFilter, partner, status])

  const cdrs = useMemo(() =>
    MOCK_CDRS
      .filter(r => !q || (r.cdr + ' ' + r.session + ' ' + r.partner).toLowerCase().includes(q.toLowerCase()))
      .filter(r => roleFilter === 'All' || r.role === roleFilter)
      .filter(r => partner === 'All' || r.partner === partner)
      .filter(r => status === 'All' || r.status === status)
  , [q, roleFilter, partner, status])

  const amtStr = (cur: string, amt: number) => {
    if (!fx) return `${cur} ${amt.toFixed(2)}`
    const usd = cur === 'EUR' ? amt * 1.05 : amt
    return `USD ${usd.toFixed(2)}`
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Roaming.</div>
  }

  const kpis = tab === 'sessions' ? SESSION_KPIS : CDR_KPIS

  return (
    <div className="space-y-6">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('sessions')}
          className={`px-4 py-2 rounded-lg font-medium ${tab === 'sessions' ? 'bg-accent text-white' : 'bg-surface border border-border hover:bg-muted'}`}
        >
          Sessions
        </button>
        <button
          onClick={() => setTab('cdrs')}
          className={`px-4 py-2 rounded-lg font-medium ${tab === 'cdrs' ? 'bg-accent text-white' : 'bg-surface border border-border hover:bg-muted'}`}
        >
          CDRs
        </button>
      </div>

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
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-6 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search session / CDR / partner" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="select">
          {['All', 'CPO', 'MSP'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={partner} onChange={e => setPartner(e.target.value)} className="select">
          {['All', 'VoltHub', 'GreenRoam'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="select">
          {tab === 'sessions'
            ? ['All', 'Completed', 'Charging', 'Failed', 'Refunded'].map(o => <option key={o}>{o}</option>)
            : ['All', 'Finalized', 'Sent', 'Disputed', 'Voided', 'Pending'].map(o => <option key={o}>{o}</option>)
          }
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={fx} onChange={e => setFx(e.target.checked)} className="rounded" />
          <span className="text-sm">Convert to USD</span>
        </label>
      </section>

      {/* Sessions Table */}
      {tab === 'sessions' && (
        <section className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
              <tr>
                <th className="w-20 px-4 py-3 text-left font-medium">Session</th>
                <th className="w-12 px-4 py-3 text-left font-medium">Role</th>
                <th className="w-24 px-4 py-3 text-left font-medium">Partner</th>
                <th className="w-28 px-4 py-3 text-left font-medium">Site</th>
                <th className="w-20 px-4 py-3 text-left font-medium">Charger</th>
                <th className="w-28 px-4 py-3 text-left font-medium">Start</th>
                <th className="w-28 px-4 py-3 text-left font-medium">End</th>
                <th className="w-12 px-4 py-3 !text-right font-medium">kWh</th>
                <th className="w-20 px-4 py-3 !text-right font-medium">Amount</th>
                <th className="w-20 px-4 py-3 text-left font-medium">Status</th>
                {canManage && <th className="w-24 px-4 py-3 !text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map(r => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium truncate max-w-[80px]" title={r.id}>{r.id}</td>
                  <td className="px-4 py-3 text-xs">{r.role}</td>
                  <td className="px-4 py-3 truncate max-w-[96px]" title={r.partner}>{r.partner}</td>
                  <td className="px-4 py-3 truncate max-w-[112px]" title={r.site}>{r.site}</td>
                  <td className="px-4 py-3 text-subtle text-xs">{r.cp}</td>
                  <td className="px-4 py-3 text-subtle text-xs whitespace-nowrap">{r.start}</td>
                  <td className="px-4 py-3 text-subtle text-xs whitespace-nowrap">{r.end}</td>
                  <td className="px-4 py-3 text-right text-xs">{r.kwh}</td>
                  <td className="px-4 py-3 text-right text-xs whitespace-nowrap">{amtStr(r.cur, r.amt)}</td>
                  <td className="px-4 py-3"><SessionStatusPill status={r.status} /></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => toast(`Push CDR for ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Push CDR</button>
                        <button onClick={() => toast(`Refunded ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Refund</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && <div className="p-8 text-center text-subtle">No sessions match your filters.</div>}
        </section>
      )}

      {/* CDRs Table */}
      {tab === 'cdrs' && (
        <section className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
              <tr>
                <th className="w-20 px-4 py-3 text-left font-medium">CDR</th>
                <th className="w-20 px-4 py-3 text-left font-medium">Session</th>
                <th className="w-12 px-4 py-3 text-left font-medium">Role</th>
                <th className="w-24 px-4 py-3 text-left font-medium">Partner</th>
                <th className="w-28 px-4 py-3 text-left font-medium">Site</th>
                <th className="w-12 px-4 py-3 !text-right font-medium">kWh</th>
                <th className="w-20 px-4 py-3 !text-right font-medium">Amount</th>
                <th className="w-16 px-4 py-3 !text-right font-medium">Fee</th>
                <th className="w-20 px-4 py-3 !text-right font-medium">Net</th>
                <th className="w-20 px-4 py-3 text-left font-medium">Status</th>
                {canManage && <th className="w-24 px-4 py-3 !text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cdrs.map(r => (
                <tr key={r.cdr} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium truncate max-w-[80px]" title={r.cdr}>{r.cdr}</td>
                  <td className="px-4 py-3 text-subtle text-xs truncate max-w-[80px]" title={r.session}>{r.session}</td>
                  <td className="px-4 py-3 text-xs">{r.role}</td>
                  <td className="px-4 py-3 truncate max-w-[96px]" title={r.partner}>{r.partner}</td>
                  <td className="px-4 py-3 truncate max-w-[112px]" title={r.site}>{r.site}</td>
                  <td className="px-4 py-3 text-right text-xs">{r.kwh}</td>
                  <td className="px-4 py-3 text-right text-xs whitespace-nowrap">{amtStr(r.cur, r.amt)}</td>
                  <td className="px-4 py-3 text-right text-xs whitespace-nowrap">{amtStr(r.cur, r.fee)}</td>
                  <td className="px-4 py-3 text-right text-xs whitespace-nowrap font-medium">{amtStr(r.cur, r.net)}</td>
                  <td className="px-4 py-3"><CDRStatusPill status={r.status} /></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => toast(`Downloaded PDF for ${r.cdr}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">PDF</button>
                        <button onClick={() => toast(`Re-sent ${r.cdr}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Resend</button>
                        {r.status !== 'Voided' && (
                          <button onClick={() => toast(`Voided ${r.cdr}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs text-red-600">Void</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {cdrs.length === 0 && <div className="p-8 text-center text-subtle">No CDRs match your filters.</div>}
        </section>
      )}
    </div>
  )
}

function SessionStatusPill({ status }: { status: SessionStatus }) {
  const colors: Record<SessionStatus, string> = {
    Completed: 'bg-emerald-100 text-emerald-700',
    Charging: 'bg-blue-100 text-blue-700',
    Failed: 'bg-rose-100 text-rose-700',
    Refunded: 'bg-amber-100 text-amber-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

function CDRStatusPill({ status }: { status: CDRStatus }) {
  const colors: Record<CDRStatus, string> = {
    Finalized: 'bg-emerald-100 text-emerald-700',
    Sent: 'bg-blue-100 text-blue-700',
    Disputed: 'bg-amber-100 text-amber-700',
    Voided: 'bg-gray-100 text-gray-600',
    Pending: 'bg-gray-100 text-gray-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status]}`}>{status}</span>
}

export default Roaming

