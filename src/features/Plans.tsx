import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useSubscriptionPlans, useCreateSubscriptionPlan, useDeleteSubscriptionPlan } from '@/modules/subscriptions/hooks/useSubscriptionPlans'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

type PlanStatus = 'Active' | 'Deprecated'

export function Plans() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'plans')

  const [status, setStatus] = useState<PlanStatus | 'All'>('All')
  const [target, setTarget] = useState<'All' | string>('All')

  // Fetch subscription plans from API
  const { data: plans, isLoading, error } = useSubscriptionPlans({
    isActive: status === 'Active' ? true : status === 'Deprecated' ? false : undefined,
  })

  const createMutation = useCreateSubscriptionPlan()
  const deleteMutation = useDeleteSubscriptionPlan()

  const rows = useMemo(() => {
    if (!plans) return []
    return plans
      .filter((p: any) => (status === 'All' ? true : (p.isActive ? 'Active' : 'Deprecated') === status))
      .filter((p: any) => (target === 'All' ? true : p.role === target))
  }, [plans, status, target])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (err) {
        alert('Failed to delete plan')
      }
    }
  }

  const handleCreate = async () => {
    // Demo creation for now, ideally opens a modal
    const code = prompt('Enter Plan Code (unique):')
    if (!code) return

    try {
      await createMutation.mutateAsync({
        code,
        name: 'New Plan',
        description: 'Created via UI',
        role: 'STATION_OWNER',
        price: 99.99,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        isActive: true,
        isPublic: true,
        isPopular: false,
        features: []
      })
    } catch (err) {
      alert('Failed to create plan')
    }
  }


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
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="select">
            {['All', 'STATION_OWNER', 'Operator', 'Admin'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        {perms.create && (
          <div className="flex items-center gap-2">
            <button className="btn secondary" onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : '+ Create plan'}
            </button>
          </div>
        )}

        {/* Loading/Error States */}
        {isLoading && (
          <div className="py-8">
            <TextSkeleton lines={2} centered />
          </div>
        )}
        {error && <div className="text-center py-8 text-danger">Error loading plans: {error.message}</div>}

        {/* Cards */}
        {!isLoading && !error && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((p: any) => (
              <div key={p.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted">{p.code}</div>
                    <div className="text-lg font-semibold">{p.name}</div>
                  </div>
                  <span className={`pill ${p.isActive ? 'approved' : 'bg-muted/30 text-muted'}`}>
                    {p.isActive ? 'Active' : 'Deprecated'}
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  ${p.price}
                  <span className="text-sm text-muted"> / {p.billingCycle.toLowerCase()}</span>
                </div>
                <div className="text-sm text-muted">Role: {p.role}</div>
                <div className="text-sm text-muted">{p.description}</div>
                {p.features && p.features.length > 0 && (
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    {p.features.map((f: any) => (
                      <li key={f.id || f.key}>{f.name || f.featureValue}</li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-2 mt-auto">
                  {perms.edit && (
                    <button className="btn secondary" onClick={() => alert(`Edit plan ${p.id} (API integration pending)`)}>
                      Edit
                    </button>
                  )}
                  {perms.delete && (
                    <button className="btn danger" onClick={() => handleDelete(p.id)} disabled={deleteMutation.isPending}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


