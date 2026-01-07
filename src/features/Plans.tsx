import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type PlanStatus = 'Active' | 'Deprecated'

type Plan = {
  id: string
  name: string
  price: number
  currency: string
  seats?: number
  features: string[]
  status: PlanStatus
  target: 'Owner' | 'Operator' | 'Admin'
}

const mockPlans: Plan[] = [
  { id: 'PLN-GROWTH', name: 'Growth', price: 420, currency: 'USD', seats: 10, features: ['Basic support', 'Reports', 'Ops'], status: 'Active', target: 'Owner' },
  { id: 'PLN-SCALE', name: 'Scale', price: 890, currency: 'USD', seats: 50, features: ['Priority support', 'Advanced reports', 'Dispatch'], status: 'Active', target: 'Operator' },
  { id: 'PLN-ENT', name: 'Enterprise', price: 2200, currency: 'USD', seats: 200, features: ['SLA', 'Custom integrations'], status: 'Active', target: 'Admin' },
  { id: 'PLN-TRIAL', name: 'Trial', price: 0, currency: 'USD', seats: 5, features: ['Limited features'], status: 'Deprecated', target: 'Owner' },
]

export function Plans() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'plans')

  const [status, setStatus] = useState<PlanStatus | 'All'>('All')
  const [target, setTarget] = useState<'All' | Plan['target']>('All')

  const rows = useMemo(() => {
    return mockPlans
      .filter((p) => (status === 'All' ? true : p.status === status))
      .filter((p) => (target === 'All' ? true : p.target === target))
  }, [status, target])

  return (
    <DashboardLayout pageTitle="Plans & Pricing">
      <div className="space-y-4">
        {/* Filters */}
        <div className="card grid md:grid-cols-4 gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value as PlanStatus | 'All')} className="select">
            {['All', 'Active', 'Deprecated'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={target} onChange={(e) => setTarget(e.target.value as Plan['target'] | 'All')} className="select">
            {['All', 'Owner', 'Operator', 'Admin'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        {perms.create && (
          <div className="flex items-center gap-2">
            <button className="btn secondary" onClick={() => alert('Create plan (mock)')}>
              + Create plan
            </button>
          </div>
        )}

        {/* Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((p) => (
            <div key={p.id} className="card flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted">{p.id}</div>
                  <div className="text-lg font-semibold">{p.name}</div>
                </div>
                <span className={`pill ${p.status === 'Active' ? 'approved' : 'bg-muted/30 text-muted'}`}>{p.status}</span>
              </div>
              <div className="text-2xl font-bold">
                ${p.price}
                <span className="text-sm text-muted"> / mo</span>
              </div>
              <div className="text-sm text-muted">Target: {p.target}</div>
              <div className="text-sm text-muted">Seats: {p.seats ?? '—'}</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="flex items-center gap-2 mt-auto">
                {perms.edit && (
                  <button className="btn secondary" onClick={() => alert('Edit plan (mock)')}>
                    Edit
                  </button>
                )}
                {perms.delete && (
                  <button className="btn danger" onClick={() => alert('Delete plan (mock)')}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

