import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Owner Settlement — Revenue sharing configuration
   RBAC: Owners (can edit Owner/Operator/Site Owner), Platform admins (read-only)
───────────────────────────────────────────────────────────────────────────── */

export function OwnerSettlement() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'OWNER'
  const canView = hasPermission(role, 'settlement', 'view')
  const canEdit = hasPermission(role, 'settlement', 'edit')

  const [split, setSplit] = useState({ owner: 55, operator: 25, siteOwner: 10, platform: 10 })
  const [note, setNote] = useState('')
  const [notified, setNotified] = useState(false)
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const total = split.owner + split.operator + split.siteOwner + split.platform
  const remainder = 100 - total
  const invalid = Math.abs(remainder) > 0.001

  const updateSplit = (key: keyof typeof split) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, Number(e.target.value) || 0))
    setSplit(s => ({ ...s, [key]: value }))
  }

  const fillRemainderToOwner = () => {
    setSplit(s => ({ ...s, owner: Math.max(0, s.owner + remainder) }))
  }

  const onSaveNotify = () => {
    if (invalid) {
      toast('Total must equal 100%')
      return
    }
    setNotified(true)
    toast('Settlement updated and stakeholders notified')
    setTimeout(() => setNotified(false), 4000)
  }

  const auditLog = [
    { ts: '2025-10-15 14:22', who: 'Owner', msg: 'Adjusted Operator from 20%→25%' },
    { ts: '2025-09-01 09:05', who: 'Admin', msg: 'Platform set to 10%' },
    { ts: '2025-08-20 11:30', who: 'Owner', msg: 'Initial split configured' },
  ]

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Settlement.</div>
  }

  return (
    <div className="space-y-6">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-emerald-900">Settlement — Owner</h1>
            <div className="text-sm text-emerald-700 mt-1">EVzone — Kampala CBD #1 • STN-KLA-001</div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 bg-emerald-100 text-emerald-800">
            ROLE: OWNER
          </span>
        </div>
        <div className="mt-3 text-sm text-emerald-800">
          Plan <strong>Growth</strong> allows <strong>5</strong> stations. In use: <strong>2</strong>.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Sharing */}
          <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-semibold text-lg">Revenue Sharing</h2>
              <p className="text-sm text-subtle">Edit your agreed shares (Platform % is locked)</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Owner %</span>
                <input
                  type="number"
                  value={split.owner}
                  onChange={updateSplit('owner')}
                  disabled={!canEdit}
                  className="w-full rounded-lg border border-border px-3 py-2 disabled:bg-muted disabled:cursor-not-allowed"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Operator %</span>
                <input
                  type="number"
                  value={split.operator}
                  onChange={updateSplit('operator')}
                  disabled={!canEdit}
                  className="w-full rounded-lg border border-border px-3 py-2 disabled:bg-muted disabled:cursor-not-allowed"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Site Owner %</span>
                <input
                  type="number"
                  value={split.siteOwner}
                  onChange={updateSplit('siteOwner')}
                  disabled={!canEdit}
                  className="w-full rounded-lg border border-border px-3 py-2 disabled:bg-muted disabled:cursor-not-allowed"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Platform %</span>
                <input
                  type="number"
                  value={split.platform}
                  disabled
                  className="w-full rounded-lg border border-border px-3 py-2 bg-muted cursor-not-allowed"
                />
                <span className="text-xs text-subtle">Locked by admin</span>
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-subtle">Total: </span>
                <span className={`font-medium ${invalid ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {total.toFixed(1)}%
                </span>
                {invalid && (
                  <span className="ml-2 text-xs text-rose-600">
                    ({remainder > 0 ? '+' : ''}{remainder.toFixed(1)}%)
                  </span>
                )}
              </div>
              {invalid && (
                <button
                  onClick={fillRemainderToOwner}
                  className="text-sm text-accent hover:underline"
                >
                  Fill remainder to Owner
                </button>
              )}
            </div>
          </section>

          {/* Request Change */}
          {canEdit && (
            <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
              <h3 className="font-semibold mb-3">Request a Change</h3>
              <p className="text-sm text-subtle mb-4">
                Propose new shares to Owner & Admin
              </p>
              <label className="block space-y-1 mb-4">
                <span className="text-sm font-medium">Reason</span>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                  placeholder="Add reason for the change..."
                  className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </label>
              <div className="flex items-center justify-between">
                <div className="text-sm text-subtle">
                  Your proposal will be sent to Owner, Site Owner and Admin.
                </div>
                <button
                  onClick={onSaveNotify}
                  disabled={invalid}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Save & Notify
                </button>
              </div>
              {notified && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  Request sent. Stakeholders will be notified.
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-6 h-fit">
          {/* Activity Log */}
          <section className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Activity</h3>
            <p className="text-xs text-subtle mb-3">Recent changes</p>
            <ul className="space-y-3">
              {auditLog.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{item.msg}</div>
                    <div className="text-xs text-subtle">{item.ts} • {item.who}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default OwnerSettlement

