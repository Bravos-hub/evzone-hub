import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Technician = {
  id: string
  name: string
  region: string
  skills: string[]
  sla: string
  cap: number
  assigned: number
}

type PendingJob = {
  id: string
  site: string
  type: string
  prio: string
}

const IconSearch = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-3.6-3.6" />
  </svg>
)

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Operator Assignments - Operator feature
 * Technician assignment board for assigning jobs to technicians
 */
export function OperatorAssignments() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'jobs')

  const [q, setQ] = useState('')
  const [region, setRegion] = useState('All')
  const [skill, setSkill] = useState('All')
  const [sla, setSla] = useState('All')
  const [window, setWindow] = useState('Today')
  const [ack, setAck] = useState('')

  const techs: Technician[] = [
    { id: 'tx-010', name: 'RapidCharge Techs', region: 'Nairobi', skills: ['OCPP', 'ISO 15118', 'DC Fast'], sla: 'Gold', cap: 3, assigned: 1 },
    { id: 'tx-011', name: 'FixVolt Ltd', region: 'Kampala', skills: ['OCPP', 'AC Type 2'], sla: 'Gold', cap: 4, assigned: 2 },
    { id: 'tx-012', name: 'PowerMobility Co', region: 'Wuxi', skills: ['AC Type 2'], sla: 'Silver', cap: 2, assigned: 0 },
  ]

  const pending: PendingJob[] = [
    { id: 'JOB-441', site: 'Central Hub', type: 'Replace fan', prio: 'High' },
    { id: 'JOB-440', site: 'Airport East', type: 'Comm check', prio: 'Medium' },
  ]

  const filtered = useMemo(() => {
    return techs
      .filter((t) => (q ? t.name.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((t) => (region === 'All' ? true : t.region === region))
      .filter((t) => (sla === 'All' ? true : t.sla === sla))
      .filter((t) => (skill === 'All' ? true : t.skills.includes(skill)))
  }, [q, region, sla, skill])

  function assign(jobId: string, techId: string) {
    setAck(`Assigned ${jobId} → ${techId} (demo)`)
    setTimeout(() => setAck(''), 1500)
  }

  if (!perms.view) {
    return (
      <DashboardLayout pageTitle="Assignments">
        <Card>
          <p className="text-muted">You don't have permission to view this page.</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Operator — Assignments">
      {ack && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{ack}</div>}

      {/* Header actions */}
      <div className="mb-4 flex items-center justify-end">
        <Link to="/operator-jobs" className="btn secondary">
          Jobs
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid md:grid-cols-6 gap-2">
          <label className="relative md:col-span-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <IconSearch />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search technician/company"
              className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            {['All', 'Kampala', 'Nairobi', 'Wuxi'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            {['All', 'OCPP', 'ISO 15118', 'DC Fast', 'AC Type 2'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            value={sla}
            onChange={(e) => setSla(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            {['All', 'Bronze', 'Silver', 'Gold'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            value={window}
            onChange={(e) => setWindow(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            {['Today', 'Next 7 days'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Capacity Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {filtered.map((t) => {
          const free = Math.max(0, t.cap - t.assigned)
          const bar = Math.round((t.assigned / Math.max(t.cap, 1)) * 100)
          return (
            <Card key={t.id} className="hover:shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-text">{t.name}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">{t.sla}</span>
              </div>
              <div className="mt-1 text-xs text-muted">
                {t.region} • {t.skills.join(', ')}
              </div>
              <div className="mt-3 text-sm">Capacity: {t.assigned}/{t.cap} assigned • {free} free</div>
              <div className="mt-1 h-2 rounded-full bg-surface-alt overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-orange-500" style={{ width: `${bar}%` }} />
              </div>
              {pending.length > 0 && (
                <div className="mt-3 text-right">
                  <button
                    onClick={() => assign(pending[0].id, t.id)}
                    className="text-sm text-accent hover:underline"
                  >
                    Assign next job
                  </button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Pending jobs */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Pending jobs</h3>
          <Link to="/operator-jobs" className="text-sm text-accent hover:underline">
            Open jobs
          </Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-muted">
              <tr>
                <th className="px-4 py-2 text-left">Job</th>
                <th className="px-4 py-2 text-left">Site</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-right">Assign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pending.map((j) => (
                <tr key={j.id} className="hover:bg-surface-alt">
                  <td className="px-4 py-2 whitespace-nowrap font-medium">{j.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{j.site}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{j.type}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{j.prio}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    <button onClick={() => assign(j.id, '(pick tech)')} className="btn secondary text-xs">
                      Assign…
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  )
}

