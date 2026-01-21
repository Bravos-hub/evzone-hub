import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & ICONS
// ═══════════════════════════════════════════════════════════════════════════

type TeamMember = {
  id: string
  name: string
  role: string
  status: 'On Shift' | 'Off Duty' | 'Available'
  phone: string
  email: string
  skills: string[]
  certs: string[]
  util: string
}

type Job = {
  id: string
  site: string
  start: string
  status: string
}

type CalendarRow = {
  id: string
  start: string
  end: string
  status: string
}

const IconUser = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M5 21a7 7 0 0114 0" />
  </svg>
)

const IconPhone = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v-2a4 4 0 0 0-4-4h-1a3 3 0 0 0-3 3v1" />
    <path d="M14 5a2 2 0 0 1-2 2H9a6 6 0 0 0-6 6v1a4 4 0 0 0 4 4h1" />
  </svg>
)

const IconMail = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M3 10l9 5 9-5" />
  </svg>
)

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function dayStart(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addMin(d: Date, m: number): Date {
  return new Date(new Date(d).getTime() + m * 60000)
}

function cls(...a: (string | undefined | null | false)[]): string {
  return a.filter(Boolean).join(' ')
}

// ═══════════════════════════════════════════════════════════════════════════
// WEEK CALENDAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function WeekCalendar({ rows }: { rows: CalendarRow[] }) {
  const start = dayStart(new Date())
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addMin(start, i * 1440))
  const hours = [0, 4, 8, 12, 16, 20, 24]

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="grid grid-cols-8 text-xs text-muted">
        <div />
        {days.map((d, i) => (
          <div key={i} className="px-2 py-1 font-medium">
            {d.toDateString().slice(0, 10)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8">
        <div className="text-xs text-muted px-2 py-1 space-y-8">
          {hours.map((h) => (
            <div key={h} style={{ height: 48 }}>
              {pad(h)}:00
            </div>
          ))}
        </div>
        {days.map((d, di) => (
          <div key={di} className="border-l relative" style={{ height: hours.length * 48 }}>
            {rows
              .filter((r) => new Date(r.start).toDateString() === d.toDateString())
              .map((r) => {
                const st = new Date(r.start)
                const en = new Date(r.end)
                const top = ((st.getHours() * 60 + st.getMinutes()) / 60) * 48 / 4
                const ht = ((en.getTime() - st.getTime()) / 60000 / 60) * 48
                return (
                  <div
                    key={r.id}
                    className={cls(
                      'absolute left-1 right-1 rounded text-[11px] px-2 py-1',
                      r.status === 'In Progress' ? 'bg-sky-200 text-sky-900' : 'bg-surface-alt text-text'
                    )}
                    style={{ top: top, height: Math.max(ht, 20) }}
                  >
                    {r.id} • {st.toLocaleTimeString()}–{en.toLocaleTimeString()}
                  </div>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Operator Team Detail - Operator feature
 * Shows team member details with tabs: Overview, Schedule, Jobs, Activity
 */
export function OperatorTeamDetail() {
  const { id } = useParams<{ id: string }>()
  const memberId = id || 'op-201'
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'team')

  const [tab, setTab] = useState('Overview')
  const [member, setMember] = useState<TeamMember>({
    id: memberId,
    name: 'Aisha Nakyewa',
    role: 'Technician',
    status: 'On Shift',
    phone: '+256 772 123456',
    email: 'aisha@evzone.com',
    skills: ['DC Fast', 'Type 2'],
    certs: ['Electrical LV', 'OCPP Basics'],
    util: '76%',
  })

  const [jobs, setJobs] = useState<Job[]>([
    { id: 'JOB-4312', site: 'Central Hub', start: '2025-11-03T10:00', status: 'In Progress' },
    { id: 'JOB-4301', site: 'Airport East', start: '2025-11-02T15:30', status: 'Completed' },
  ])

  function startShift() {
    setMember((m) => ({ ...m, status: 'On Shift' }))
  }

  function endShift() {
    setMember((m) => ({ ...m, status: 'Off Duty' }))
  }

  if (!perms.view) {
    return (
      <DashboardLayout pageTitle="Team Member Detail">
        <Card>
          <p className="text-muted">You don't have permission to view this page.</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={`Team Member — ${member.name}`}>
      {/* Status bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              member.status === 'On Shift'
                ? 'bg-emerald-100 text-emerald-700'
                : member.status === 'Off Duty'
                  ? 'bg-surface-alt text-muted'
                  : 'bg-sky-100 text-sky-700'
            }`}
          >
            {member.status}
          </span>
        </div>
        <Link to="/team" className="btn secondary">
          Back to Team
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <ul className="flex items-center gap-2 px-2">
          {['Overview', 'Schedule', 'Jobs', 'Activity'].map((t) => (
            <li key={t}>
              <button
                onClick={() => setTab(t)}
                className={cls(
                  'px-4 py-2 border-b-2',
                  tab === t ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text'
                )}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <h3 className="font-semibold mb-2">Profile</h3>
              <div className="grid sm:grid-cols-2 text-sm gap-3">
                <div>
                  <span className="text-muted">Role</span>
                  <div className="font-medium">{member.role}</div>
                </div>
                <div className="inline-flex items-center gap-2">
                  <IconPhone />
                  {member.phone}
                </div>
                <div className="inline-flex items-center gap-2">
                  <IconMail />
                  {member.email}
                </div>
                <div>
                  <span className="text-muted">Utilization</span>
                  <div className="font-medium">{member.util}</div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-2">Skills & Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-surface-alt text-sm">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-sm text-muted">Certs: {member.certs.join(', ')}</div>
            </Card>
          </div>

          <Card>
            <div className="font-semibold mb-2">Quick actions</div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button className="btn primary" onClick={startShift}>
                  Start Shift
                </button>
                <button className="btn secondary" onClick={endShift}>
                  End Shift
                </button>
              </div>
              <div className="flex gap-2">
                <Link to={`/operator-jobs/new?assignee=${member.id}`} className="btn secondary">
                  Assign Job
                </Link>
                <Link to={`/team/${member.id}?tab=profile`} className="btn secondary">
                  Edit
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'Schedule' && (
        <Card>
          <h3 className="font-semibold mb-2">This Week</h3>
          <WeekCalendar
            rows={jobs.map((j) => ({
              id: j.id,
              start: j.start,
              end: addMin(new Date(j.start), 60).toISOString(),
              status: j.status,
            }))}
          />
          <p className="text-xs text-muted mt-2">Blue = in progress, Gray = off duty.</p>
        </Card>
      )}

      {tab === 'Jobs' && (
        <Card>
          <h3 className="font-semibold mb-2">Assignments</h3>
          <ul className="text-sm divide-y divide-border">
            {jobs.map((j) => (
              <li key={j.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {j.id} • {j.site}
                  </div>
                  <div className="text-muted">{new Date(j.start).toLocaleString()}</div>
                </div>
                <div className="inline-flex gap-2">
                  <Link to={`/operator-jobs/${j.id}`} className="btn secondary text-xs">
                    Open
                  </Link>
                  <button className="btn secondary text-xs">Mark done</button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'Activity' && (
        <Card>
          <h3 className="font-semibold mb-2">Recent activity</h3>
          <ul className="text-sm list-disc pl-5 text-muted space-y-1">
            <li>Shift started 08:01</li>
            <li>Assigned JOB-4312</li>
            <li>Checked in at Central Hub 10:03</li>
          </ul>
        </Card>
      )}
    </DashboardLayout>
  )
}

