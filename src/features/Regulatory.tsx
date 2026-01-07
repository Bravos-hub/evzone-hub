import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Regulatory & Compliance Dashboard
   RBAC: Platform admins only
───────────────────────────────────────────────────────────────────────────── */

interface DSARRequest {
  id: string
  subject: string
  region: string
  received: string
  due: string
  status: 'In review' | 'Pending' | 'Completed'
}

interface ExportJob {
  id: string
  dataset: string
  range: string
  size: string
  status: 'Running' | 'Queued' | 'Completed'
  requested: string
}

interface RiskItem {
  id: string
  title: string
  sev: 'High' | 'Med' | 'Low'
  owner: string
  status: 'Open' | 'Planned' | 'Closed'
}

const KPIS = [
  { label: 'Open DSARs', value: '3' },
  { label: 'Export jobs pending', value: '2' },
  { label: 'Policy gaps', value: '1' },
  { label: 'Incidents (24h)', value: '0' },
  { label: 'Audits due (30d)', value: '2' },
]

const CHECKLIST = [
  { item: 'Data Retention (EU GDPR)', ok: true },
  { item: 'Breach Notification (Uganda DP Act)', ok: true },
  { item: 'Pricing Transparency (Utility Reg.)', ok: false },
  { item: 'Security Baseline (SOC2‑lite)', ok: true },
]

const MOCK_DSARS: DSARRequest[] = [
  { id: 'DSAR-2204', subject: 'User (Driver)', region: 'EU', received: '2025-10-25', due: '2025-11-08', status: 'In review' },
  { id: 'DSAR-2203', subject: 'Partner (CPO)', region: 'UK', received: '2025-10-22', due: '2025-11-05', status: 'Pending' },
  { id: 'DSAR-2202', subject: 'User (Technician)', region: 'UG', received: '2025-10-18', due: '2025-11-01', status: 'Completed' },
]

const MOCK_EXPORTS: ExportJob[] = [
  { id: 'EXP-3302', dataset: 'Sessions', range: 'Oct 01‑28', size: '12.4 MB', status: 'Running', requested: '2025-10-29 10:12' },
  { id: 'EXP-3301', dataset: 'Users (PII)', range: 'Oct 01‑15', size: '2.1 MB', status: 'Queued', requested: '2025-10-28 18:41' },
  { id: 'EXP-3290', dataset: 'Invoices', range: 'Sep', size: '8.9 MB', status: 'Completed', requested: '2025-10-01 09:10' },
]

const MOCK_RISKS: RiskItem[] = [
  { id: 'R-120', title: 'Tariff display mismatch', sev: 'Med', owner: 'Billing', status: 'Open' },
  { id: 'R-103', title: 'Outdated privacy notice (CN)', sev: 'Low', owner: 'Legal', status: 'Planned' },
]

const POLICY_VERSIONS = [
  { policy: 'Privacy', version: '1.3.0', date: '2025-10-11' },
  { policy: 'Terms', version: '2.0.1', date: '2025-09-01' },
  { policy: 'Cookies', version: '1.1.2', date: '2025-08-02' },
]

export function Regulatory() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'
  const canView = hasPermission(role, 'compliance', 'view')

  const [jurisdiction, setJurisdiction] = useState('All')
  const [scope, setScope] = useState('All')
  const [q, setQ] = useState('')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const dsars = useMemo(() =>
    MOCK_DSARS
      .filter(r => !q || (r.id + ' ' + r.subject).toLowerCase().includes(q.toLowerCase()))
      .filter(r => jurisdiction === 'All' || r.region === jurisdiction)
  , [q, jurisdiction])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Regulatory Dashboard.</div>
  }

  return (
    <div className="space-y-6">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {KPIS.map(k => (
          <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-5 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search DSAR / policy / export" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['All', 'EU', 'US', 'UK', 'CA', 'CN', 'UG', 'KE'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={scope} onChange={e => setScope(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2">
          {['All', 'Data', 'Operations', 'Pricing', 'Security'].map(o => <option key={o}>{o}</option>)}
        </select>
        <button onClick={() => toast('Exported (demo)')} className="px-3 py-2 rounded-lg border border-border hover:bg-muted flex items-center gap-2 justify-center">
          Export
        </button>
      </section>

      {/* Compliance checklist */}
      <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l7 4v6c0 5-3 9-7 11-4-2-7-6-7-11V6l7-4z" /></svg>
            Compliance Checklist
          </h2>
          <button onClick={() => toast('Exported checklist')} className="text-sm text-accent hover:underline">Export</button>
        </div>
        <ul className="grid md:grid-cols-2 gap-3">
          {CHECKLIST.map((c, i) => (
            <li key={i} className={`rounded-lg border p-3 flex items-center justify-between ${c.ok ? 'bg-muted border-border' : 'bg-rose-50 border-rose-200'}`}>
              <span>{c.item}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {c.ok ? 'OK' : 'GAP'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* DSAR requests */}
      <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">DSAR Requests</h2>
          <button onClick={() => toast('Manage workflows (demo)')} className="text-sm text-accent hover:underline">Manage workflows</button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
              <tr>
                <th className="px-4 py-2 text-left font-medium">ID</th>
                <th className="px-4 py-2 text-left font-medium">Subject</th>
                <th className="px-4 py-2 text-left font-medium">Region</th>
                <th className="px-4 py-2 text-left font-medium">Received</th>
                <th className="px-4 py-2 text-left font-medium">Due</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dsars.map(r => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2 font-medium">{r.id}</td>
                  <td className="px-4 py-2">{r.subject}</td>
                  <td className="px-4 py-2">{r.region}</td>
                  <td className="px-4 py-2 text-subtle">{r.received}</td>
                  <td className="px-4 py-2 text-subtle">{r.due}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => toast(`Open ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Open</button>
                      <button onClick={() => toast(`Assigned ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Assign</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Export jobs & Risk register */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Export jobs */}
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Export Jobs</h2>
            <button onClick={() => toast('Export CSV (demo)')} className="text-sm text-accent hover:underline">CSV</button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-subtle">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Job</th>
                  <th className="px-3 py-2 text-left font-medium">Dataset</th>
                  <th className="px-3 py-2 text-left font-medium">Range</th>
                  <th className="px-3 py-2 text-left font-medium">Size</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_EXPORTS.map(e => (
                  <tr key={e.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{e.id}</td>
                    <td className="px-3 py-2">{e.dataset}</td>
                    <td className="px-3 py-2 text-subtle">{e.range}</td>
                    <td className="px-3 py-2 text-subtle">{e.size}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        e.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        e.status === 'Running' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk register */}
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Risk Register</h2>
            <button onClick={() => toast('Download (demo)')} className="text-sm text-accent hover:underline">Download</button>
          </div>
          <ul className="divide-y divide-border">
            {MOCK_RISKS.map(r => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-subtle">Owner: {r.owner}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.sev === 'High' ? 'bg-rose-100 text-rose-700' :
                  r.sev === 'Med' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                }`}>{r.sev}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Policy versions */}
      <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Policy Versions</h2>
        <ul className="grid md:grid-cols-3 gap-3">
          {POLICY_VERSIONS.map((p, i) => (
            <li key={i} className="rounded-lg border border-border bg-muted p-4 flex items-center justify-between">
              <span>{p.policy} • v{p.version}</span>
              <span className="text-xs text-subtle">{p.date}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default Regulatory

