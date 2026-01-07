import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Priority = {
  id: number
  label: string
  weight: number
}

type Window = {
  id: number
  days: Set<string>
  start: string
  end: string
  action: string
}

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load Policy Builder - Owner feature
 * DLM (Dynamic Load Management) rules configuration
 */
export function LoadPolicy() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'smartCharging')

  const [form, setForm] = useState({
    name: 'Default Policy',
    site: 'Central Hub',
    mode: 'Automatic',
    importLimit: 500,
    reserve: 40,
    minPerConn: 6,
    maxPerConn: 150,
    fairnessMins: 30,
  })

  const [priorities, setPriorities] = useState<Priority[]>([
    { id: 1, label: 'Accessible bays', weight: 5 },
    { id: 2, label: 'DC Fast first', weight: 4 },
    { id: 3, label: 'Even wear (round‑robin)', weight: 3 },
  ])

  const [triggers, setTriggers] = useState({
    highPrice: '0.40',
    gridEvent: false,
    pvSurplus: true,
  })

  const [windows, setWindows] = useState<Window[]>([
    { id: 1, days: new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']), start: '22:00', end: '06:00', action: 'Relax limit by 10%' },
  ])

  function update(k: keyof typeof form, v: any) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function setPriority(id: number, k: keyof Priority, v: any) {
    setPriorities((p) => p.map((r) => (r.id === id ? { ...r, [k]: v } : r)))
  }

  function addPriority() {
    setPriorities((p) => [...p, { id: Date.now(), label: 'New rule', weight: 1 }])
  }

  function delPriority(id: number) {
    setPriorities((p) => p.filter((r) => r.id !== id))
  }

  function setWindow(id: number, k: keyof Window, v: any) {
    setWindows((w) => w.map((r) => (r.id === id ? { ...r, [k]: v } : r)))
  }

  function toggleDay(id: number, d: string) {
    setWindows((w) =>
      w.map((r) => (r.id === id ? { ...r, days: r.days.has(d) ? new Set([...r.days].filter((x) => x !== d)) : new Set([...r.days, d]) } : r))
    )
  }

  function addWindow() {
    setWindows((w) => [
      ...w,
      { id: Date.now(), days: new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']), start: '08:00', end: '18:00', action: 'Relax limit by 5%' },
    ])
  }

  function delWindow(id: number) {
    setWindows((w) => w.filter((r) => r.id !== id))
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    alert('Policy saved (demo).')
  }

  function activate(e: React.FormEvent) {
    e.preventDefault()
    alert('Policy activated (demo).')
  }

  if (!perms.view) {
    return (
      <DashboardLayout pageTitle="Load Policy">
        <Card>
          <p className="text-muted">You don't have permission to view this page.</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={`Load Policy — ${form.site}`}>
      <form onSubmit={save}>
        {/* Basics */}
        <Card className="mb-6">
          <h3 className="font-semibold mb-3">Policy basics</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Policy name</span>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="rounded-xl border border-border px-3 py-2"
                disabled={!perms.configure}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Site</span>
              <select
                value={form.site}
                onChange={(e) => update('site', e.target.value)}
                className="rounded-xl border border-border px-3 py-2"
                disabled={!perms.configure}
              >
                {['Central Hub', 'Airport East', 'Tech Park A'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Mode</span>
              <select
                value={form.mode}
                onChange={(e) => update('mode', e.target.value)}
                className="rounded-xl border border-border px-3 py-2"
                disabled={!perms.configure}
              >
                {['Automatic', 'Manual'].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Import limit (kW)</span>
              <input
                type="number"
                value={form.importLimit}
                onChange={(e) => update('importLimit', Number(e.target.value) || 0)}
                className="rounded-xl border border-border px-3 py-2"
                disabled={!perms.configure}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Reserve (kW)</span>
              <input
                type="number"
                value={form.reserve}
                onChange={(e) => update('reserve', Number(e.target.value) || 0)}
                className="rounded-xl border border-border px-3 py-2"
                disabled={!perms.configure}
              />
            </label>
          </div>
        </Card>

        {/* Priorities */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Priorities</h3>
            {perms.configure && (
              <button type="button" className="btn secondary" onClick={addPriority}>
                + Add rule
              </button>
            )}
          </div>
          <ul className="grid gap-2">
            {priorities.map((r) => (
              <li key={r.id} className="grid md:grid-cols-12 gap-2 items-center rounded-xl border border-border p-3">
                <input
                  value={r.label}
                  onChange={(e) => setPriority(r.id, 'label', e.target.value)}
                  className="md:col-span-8 rounded-lg border border-border px-2 py-2"
                  disabled={!perms.configure}
                />
                <div className="md:col-span-3 flex items-center gap-2">
                  <span className="text-sm text-muted">Weight</span>
                  <input
                    type="number"
                    value={r.weight}
                    onChange={(e) => setPriority(r.id, 'weight', Number(e.target.value) || 0)}
                    className="w-20 rounded-lg border border-border px-2 py-2"
                    disabled={!perms.configure}
                  />
                </div>
                {perms.configure && (
                  <div className="md:col-span-1 text-right">
                    <button type="button" className="btn secondary" onClick={() => delPriority(r.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Constraints */}
        <Card className="mb-6">
          <h3 className="font-semibold mb-3">Constraints</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Min per connector (kW)</span>
              <input
                type="number"
                value={form.minPerConn}
                onChange={(e) => update('minPerConn', Number(e.target.value) || 0)}
                className="rounded-xl border border-border px-3 py-2"
                disabled={!perms.configure}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Max per connector (kW)</span>
              <input
                type="number"
                value={form.maxPerConn}
                onChange={(e) => update('maxPerConn', Number(e.target.value) || 0)}
                className="rounded-xl border border-border px-3 py-2"
                disabled={!perms.configure}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Fairness window (mins)</span>
              <input
                type="number"
                value={form.fairnessMins}
                onChange={(e) => update('fairnessMins', Number(e.target.value) || 0)}
                className="rounded-xl border border-border px-3 py-2"
                disabled={!perms.configure}
              />
            </label>
          </div>
        </Card>

        {/* Triggers */}
        <Card className="mb-6">
          <h3 className="font-semibold mb-3">Event triggers</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <label className="grid gap-1">
              <span className="text-muted">High price ($/kWh)</span>
              <input
                value={triggers.highPrice}
                onChange={(e) => setTriggers((t) => ({ ...t, highPrice: e.target.value }))}
                className="input"
                disabled={!perms.configure}
              />
            </label>
            <label className="inline-flex items-center gap-2 self-end">
              <input
                type="checkbox"
                checked={triggers.gridEvent}
                onChange={(e) => setTriggers((t) => ({ ...t, gridEvent: e.target.checked }))}
                className="rounded border-border"
                disabled={!perms.configure}
              />
              Grid event (DSO signal)
            </label>
            <label className="inline-flex items-center gap-2 self-end">
              <input
                type="checkbox"
                checked={triggers.pvSurplus}
                onChange={(e) => setTriggers((t) => ({ ...t, pvSurplus: e.target.checked }))}
                className="rounded border-border"
                disabled={!perms.configure}
              />
              PV surplus capture
            </label>
          </div>
        </Card>

        {/* Windows */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Schedule windows</h3>
            {perms.configure && (
              <button type="button" className="btn secondary" onClick={addWindow}>
                + Add window
              </button>
            )}
          </div>
          <ul className="grid gap-2">
            {windows.map((w) => (
              <li key={w.id} className="rounded-xl border border-border p-3">
                <div className="grid md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-3 flex flex-wrap gap-1">
                    {DAY_KEYS.map((d) => (
                      <label
                        key={d}
                        className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${
                          w.days.has(d) ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-border text-muted'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={w.days.has(d)}
                          onChange={() => toggleDay(w.id, d)}
                          disabled={!perms.configure}
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                  <input
                    type="time"
                    value={w.start}
                    onChange={(e) => setWindow(w.id, 'start', e.target.value)}
                    className="md:col-span-2 rounded-lg border border-border px-2 py-2"
                    disabled={!perms.configure}
                  />
                  <input
                    type="time"
                    value={w.end}
                    onChange={(e) => setWindow(w.id, 'end', e.target.value)}
                    className="md:col-span-2 rounded-lg border border-border px-2 py-2"
                    disabled={!perms.configure}
                  />
                  <input
                    value={w.action}
                    onChange={(e) => setWindow(w.id, 'action', e.target.value)}
                    placeholder="Action (e.g., Relax limit by 10%)"
                    className="md:col-span-4 rounded-lg border border-border px-2 py-2"
                    disabled={!perms.configure}
                  />
                  {perms.configure && (
                    <div className="md:col-span-1 text-right">
                      <button type="button" className="btn secondary" onClick={() => delWindow(w.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Actions */}
        {perms.configure && (
          <div className="flex items-center justify-end gap-2">
            <button type="button" className="btn secondary" onClick={() => window.history.back()}>
              Cancel
            </button>
            <button type="submit" className="btn secondary">
              Save
            </button>
            <button type="button" className="btn primary" onClick={activate}>
              Activate
            </button>
          </div>
        )}
      </form>
    </DashboardLayout>
  )
}

