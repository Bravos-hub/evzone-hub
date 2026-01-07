import { useMemo, useRef, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type ModulePerms = Record<string, boolean>
type Matrix = Record<string, ModulePerms>

const DEFAULT_ROLES = ['SUPER_ADMIN', 'EVZONE_ADMIN', 'OWNER', 'EVZONE_OPERATOR', 'TECHNICIAN_ORG', 'SITE_OWNER', 'MANAGER', 'ATTENDANT']
const DEFAULT_MODULES = ['Users', 'Sites', 'Charge Points', 'Sessions', 'Billing', 'Reports', 'OCPI', 'OCPP', 'Flags']

function initMatrix(mods: string[], roles: string[]): Matrix {
  const m: Matrix = {}
  mods.forEach((mod) => {
    m[mod] = {}
    roles.forEach((r) => {
      m[mod][r] = mod !== 'Flags'
    })
  })
  return m
}

export function RolesMatrix() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'rolesMatrix')

  const [org, setOrg] = useState('EVzone')
  const [env, setEnv] = useState('Production')
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES)
  const [modules, setModules] = useState<string[]>(DEFAULT_MODULES)
  const [matrix, setMatrix] = useState<Matrix>(() => initMatrix(DEFAULT_MODULES, DEFAULT_ROLES))
  const [ack, setAck] = useState('')
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toast(msg: string) {
    setAck(msg)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setAck(''), 1500)
  }

  function toggle(mod: string, role: string) {
    setMatrix((m) => ({ ...m, [mod]: { ...m[mod], [role]: !m[mod][role] } }))
  }

  function addModule() {
    const raw = window.prompt('Enter new module name:')
    const name = (raw || '').trim()
    if (!name) return
    if (modules.some((m) => m.toLowerCase() === name.toLowerCase())) {
      window.alert('Module already exists.')
      return
    }
    setModules((list) => [...list, name])
    setMatrix((prev) => {
      const next = { ...prev, [name]: {} as ModulePerms }
      roles.forEach((r) => (next[name][r] = false))
      return next
    })
    toast(`Added module "${name}"`)
  }

  function renameModule(mod: string) {
    const raw = window.prompt('Rename module:', mod)
    const name = (raw || '').trim()
    if (!name || name === mod) return
    if (modules.some((m) => m.toLowerCase() === name.toLowerCase())) {
      window.alert('Module already exists.')
      return
    }
    setModules((list) => list.map((x) => (x === mod ? name : x)))
    setMatrix((prev) => {
      const next = { ...prev }
      next[name] = next[mod]
      delete next[mod]
      return next
    })
    toast(`Renamed to "${name}"`)
  }

  function deleteModule(mod: string) {
    if (!window.confirm(`Delete module "${mod}"?`)) return
    setModules((list) => list.filter((x) => x !== mod))
    setMatrix((prev) => {
      const next = { ...prev }
      delete next[mod]
      return next
    })
    toast('Module deleted')
  }

  function allowAll(mod: string) {
    setMatrix((prev) => {
      const next = { ...prev, [mod]: { ...prev[mod] } }
      roles.forEach((r) => (next[mod][r] = true))
      return next
    })
    toast('Allowed all')
  }
  function denyAll(mod: string) {
    setMatrix((prev) => {
      const next = { ...prev, [mod]: { ...prev[mod] } }
      roles.forEach((r) => (next[mod][r] = false))
      return next
    })
    toast('Denied all')
  }

  function exportJSON() {
    if (!perms.export) {
      toast('Not allowed')
      return
    }
    const data = { org, env, roles, modules, matrix }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evz-roles-${org}-${env}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast('Downloaded policy JSON')
  }

  function save() {
    if (!perms.edit) {
      toast('Not allowed')
      return
    }
    toast('Saved policy (mock)')
  }

  function reset() {
    if (!window.confirm('Reset all toggles?')) return
    setMatrix(() => initMatrix(modules, roles))
    toast('Reset')
  }

  const summary = useMemo(
    () => ({
      modules: modules.length,
      roles: roles.length,
    }),
    [modules, roles]
  )

  return (
    <DashboardLayout pageTitle="Roles & Permissions">
      <div className="space-y-4">
        <div role="status" aria-live="polite" className={`text-sm min-h-[1.25rem] ${ack ? 'text-accent' : 'text-transparent'}`}>
          {ack || '•'}
        </div>

        {/* Filters */}
        <div className="card grid md:grid-cols-4 gap-2 items-center">
          <select value={org} onChange={(e) => setOrg(e.target.value)} className="select">
            {['EVzone', 'VoltOps Ltd', 'GridManaged'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select value={env} onChange={(e) => setEnv(e.target.value)} className="select">
            {['Production', 'Staging', 'Development'].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <div className="text-sm text-muted md:col-span-2">Changes apply to {org} • {env}</div>
        </div>

        {/* Matrix */}
        <div className="rounded-xl border border-border bg-panel overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="text-sm text-muted">Modules: {summary.modules} • Roles: {summary.roles}</div>
            <div className="flex items-center gap-2">
              <button className="btn secondary" onClick={addModule}>
                + Add module
              </button>
              {perms.export && (
                <button className="btn secondary" onClick={exportJSON}>
                  Export JSON
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-bg-secondary text-muted sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Module</th>
                  {roles.map((r) => (
                    <th key={r} className="px-4 py-2 text-left">
                      {r}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right">Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {modules.map((mod) => (
                  <tr key={mod} className="bg-panel">
                    <td className="px-4 py-2 whitespace-nowrap font-medium">{mod}</td>
                    {roles.map((role) => (
                      <td key={role} className="px-4 py-2 whitespace-nowrap">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!(matrix[mod] && matrix[mod][role])}
                            onChange={() => toggle(mod, role)}
                            className="h-4 w-4"
                          />
                          Allow
                        </label>
                      </td>
                    ))}
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2 text-xs">
                        <button className="btn secondary" onClick={() => allowAll(mod)}>
                          Allow all
                        </button>
                        <button className="btn secondary" onClick={() => denyAll(mod)}>
                          Deny all
                        </button>
                        <button className="btn secondary" onClick={() => renameModule(mod)}>
                          Rename
                        </button>
                        <button className="btn danger" onClick={() => deleteModule(mod)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button className="btn secondary" onClick={reset}>
            Reset
          </button>
          <button className="btn" onClick={save}>
            Save changes
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

