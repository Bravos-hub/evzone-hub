import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Recipe = {
  id: number
  label: string
  days: Set<string>
  start: string
  end: string
  site: string
  connector: string
  priceGt: string
  carbonGt: string
  utilGt: string
  drEvent: boolean
  pvSurplus: boolean
  actions: {
    setKwh: string
    addAdder: string
    percent: string
    cap: string
    floor: string
    waiveIdle: boolean
  }
  weight: number
}

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pricing Recipes - Owner feature
 * Dynamic pricing rules with IF-THEN conditions
 */
export function PricingRecipes() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'tariffs')

  const [ack, setAck] = useState('')
  const [error, setError] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: 1,
      label: 'Peak price clamp',
      days: new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
      start: '18:00',
      end: '20:00',
      site: 'Any',
      connector: 'Any',
      priceGt: '0.40',
      carbonGt: '',
      utilGt: '',
      drEvent: false,
      pvSurplus: false,
      actions: { setKwh: '', addAdder: '', percent: '+0', cap: '0.45', floor: '', waiveIdle: false },
      weight: 5,
    },
  ])

  function add() {
    setRecipes((r) => [
      ...r,
      {
        id: Date.now(),
        label: 'New recipe',
        days: new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
        start: '08:00',
        end: '18:00',
        site: 'Any',
        connector: 'Any',
        priceGt: '',
        carbonGt: '',
        utilGt: '',
        drEvent: false,
        pvSurplus: false,
        actions: { setKwh: '', addAdder: '', percent: '+0', cap: '', floor: '', waiveIdle: false },
        weight: 1,
      },
    ])
  }

  function del(id: number) {
    setRecipes((r) => r.filter((x) => x.id !== id))
  }

  function setField(id: number, k: keyof Recipe, v: any) {
    setRecipes((r) => r.map((x) => (x.id === id ? { ...x, [k]: v } : x)))
  }

  function toggleDay(id: number, d: string) {
    setRecipes((r) =>
      r.map((x) =>
        x.id === id
          ? { ...x, days: x.days.has(d) ? new Set([...x.days].filter((k) => k !== d)) : new Set([...x.days, d]) }
          : x
      )
    )
  }

  function setAction(id: number, k: keyof Recipe['actions'], v: any) {
    setRecipes((r) => r.map((x) => (x.id === id ? { ...x, actions: { ...x.actions, [k]: v } } : x)))
  }

  function validate() {
    for (const r of recipes) {
      if (!r.label.trim()) return 'Each recipe needs a label.'
      if (!r.start || !r.end) return 'Each recipe needs start & end times.'
    }
    return ''
  }

  function save() {
    const e = validate()
    if (e) return setError(e)
    setAck('Recipes saved (demo).')
    setTimeout(() => setAck(''), 1500)
  }

  function activate() {
    const e = validate()
    if (e) return setError(e)
    setAck('Recipes activated (demo).')
    setTimeout(() => setAck(''), 1500)
  }

  const json = JSON.stringify(
    recipes.map((r) => ({ ...r, days: [...r.days] })),
    null,
    2
  )

  if (!perms.view) {
    return (
      <DashboardLayout pageTitle="Pricing Recipes">
        <Card>
          <p className="text-muted">You don't have permission to view this page.</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Pricing Recipes">
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      {ack && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{ack}</div>}

      {/* Recipes */}
      <div className="space-y-4 mb-6">
        {recipes.map((r) => (
          <Card key={r.id}>
            <div className="grid md:grid-cols-12 gap-2 items-center mb-3">
              <input
                value={r.label}
                onChange={(e) => setField(r.id, 'label', e.target.value)}
                placeholder="Recipe label"
                className="md:col-span-3 rounded-lg border border-border px-3 py-2"
                disabled={!perms.edit}
              />
              <div className="md:col-span-3 grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={r.start}
                  onChange={(e) => setField(r.id, 'start', e.target.value)}
                  className="rounded-lg border border-border px-2 py-2"
                  disabled={!perms.edit}
                />
                <input
                  type="time"
                  value={r.end}
                  onChange={(e) => setField(r.id, 'end', e.target.value)}
                  className="rounded-lg border border-border px-2 py-2"
                  disabled={!perms.edit}
                />
              </div>
              <input
                value={r.priceGt}
                onChange={(e) => setField(r.id, 'priceGt', e.target.value)}
                placeholder="> price $/kWh"
                className="md:col-span-2 rounded-lg border border-border px-3 py-2"
                disabled={!perms.edit}
              />
              <input
                value={r.carbonGt}
                onChange={(e) => setField(r.id, 'carbonGt', e.target.value)}
                placeholder="> carbon gCO₂/kWh"
                className="md:col-span-2 rounded-lg border border-border px-3 py-2"
                disabled={!perms.edit}
              />
              <select
                value={r.site}
                onChange={(e) => setField(r.id, 'site', e.target.value)}
                className="select"
                disabled={!perms.edit}
              >
                {['Any', 'Central Hub', 'Airport East', 'Tech Park A'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <select
                value={r.connector}
                onChange={(e) => setField(r.id, 'connector', e.target.value)}
                className="select"
                disabled={!perms.edit}
              >
                {['Any', 'CCS2', 'Type 2', 'CHAdeMO'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="grid md:grid-cols-12 gap-2 items-center mb-3">
              <div className="md:col-span-5 grid grid-cols-5 gap-2">
                <input
                  value={r.actions.setKwh}
                  onChange={(e) => setAction(r.id, 'setKwh', e.target.value)}
                  placeholder="set $/kWh"
                  className="col-span-2 input"
                  disabled={!perms.edit}
                />
                <input
                  value={r.actions.addAdder}
                  onChange={(e) => setAction(r.id, 'addAdder', e.target.value)}
                  placeholder="+ $/kWh"
                  className="col-span-2 input"
                  disabled={!perms.edit}
                />
                <input
                  value={r.actions.percent}
                  onChange={(e) => setAction(r.id, 'percent', e.target.value)}
                  placeholder="± %"
                  className="col-span-1 input"
                  disabled={!perms.edit}
                />
              </div>
              <div className="md:col-span-5 grid grid-cols-4 gap-2">
                <input
                  value={r.actions.cap}
                  onChange={(e) => setAction(r.id, 'cap', e.target.value)}
                  placeholder="cap $/kWh"
                  className="col-span-2 input"
                  disabled={!perms.edit}
                />
                <input
                  value={r.actions.floor}
                  onChange={(e) => setAction(r.id, 'floor', e.target.value)}
                  placeholder="floor $/kWh"
                  className="col-span-2 input"
                  disabled={!perms.edit}
                />
              </div>
              <label className="md:col-span-2 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={r.actions.waiveIdle}
                  onChange={(e) => setAction(r.id, 'waiveIdle', e.target.checked)}
                  className="rounded border-border"
                  disabled={!perms.edit}
                />
                Waive idle fee
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">Priority</span>
                <input
                  value={r.weight}
                  onChange={(e) => setField(r.id, 'weight', Number(e.target.value) || 0)}
                  className="w-20 rounded-lg border border-border px-2 py-2"
                  disabled={!perms.edit}
                />
              </div>
              {perms.edit && (
                <button className="btn secondary" onClick={() => del(r.id)}>
                  Delete
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {perms.edit && (
        <div className="mb-6">
          <button className="btn secondary" onClick={add}>
            + Add Recipe
          </button>
        </div>
      )}

      {/* JSON Preview */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-2">JSON preview</h3>
        <textarea readOnly value={json} className="w-full h-48 font-mono text-xs rounded-lg border border-border p-3 bg-surface-alt" />
      </Card>

      {/* Actions */}
      {perms.edit && (
        <div className="flex items-center justify-end gap-2">
          <button className="btn secondary" onClick={save}>
            Save
          </button>
          <button className="btn primary" onClick={activate}>
            Activate
          </button>
        </div>
      )}
    </DashboardLayout>
  )
}

