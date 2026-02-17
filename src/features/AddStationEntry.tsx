import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { useMe } from '@/modules/auth/hooks/useAuth'
import {
  resolveChoiceTargets,
  resolveViewerContext,
  stationCreationTargetPath,
  type StationCreationTarget,
} from '@/modules/stations/utils/stationCreationPolicy'

type LocationState = { notice?: string } | null

function targetLabel(target: StationCreationTarget): string {
  return target === 'CHARGE' ? 'Charge Station' : 'Swap Station'
}

function targetDescription(target: StationCreationTarget): string {
  return target === 'CHARGE'
    ? 'Create a charging station with pricing and charger readiness setup.'
    : 'Create a swap station with provider, bay, and battery inventory setup.'
}

export function AddStationEntry() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { data: me, isLoading: meLoading } = useMe()
  const [ack, setAck] = useState('')

  const viewerContext = useMemo(() => resolveViewerContext(user, me), [user, me])
  const choiceTargets = useMemo(() => resolveChoiceTargets(viewerContext), [viewerContext])

  useEffect(() => {
    const notice = (location.state as LocationState)?.notice
    if (!notice) return
    setAck(notice)
    const timer = window.setTimeout(() => setAck(''), 2200)
    return () => window.clearTimeout(timer)
  }, [location.state])

  useEffect(() => {
    if (meLoading) return
    if (viewerContext.requiresOwnerCapabilityChoice) return
    if (choiceTargets.length !== 1) return
    navigate(stationCreationTargetPath(choiceTargets[0]), { replace: true })
  }, [meLoading, viewerContext.requiresOwnerCapabilityChoice, choiceTargets, navigate])

  const canCreateAny = viewerContext.requiresOwnerCapabilityChoice || choiceTargets.length > 0
  const isRedirecting = !meLoading && !viewerContext.requiresOwnerCapabilityChoice && choiceTargets.length === 1
  const showChooser = viewerContext.requiresOwnerCapabilityChoice || choiceTargets.length > 1

  if (meLoading && !canCreateAny) {
    return (
      <DashboardLayout pageTitle="Add Station">
        <div className="max-w-2xl mx-auto py-10">
          <div className="card text-center text-muted">Loading station creation options...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!canCreateAny && !meLoading) {
    return (
      <DashboardLayout pageTitle="Add Station">
        <div className="max-w-2xl mx-auto py-10">
          <div className="card text-center">
            <h2 className="text-xl font-bold mb-2">No permission</h2>
            <p className="text-muted">You do not have permission to add stations.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isRedirecting) {
    return (
      <DashboardLayout pageTitle="Add Station">
        <div className="max-w-2xl mx-auto py-10">
          <div className="card text-center text-muted">Redirecting to the correct station wizard...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Add Station">
      <div className="max-w-3xl mx-auto space-y-4">
        {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}
        {showChooser && (
          <div className="card">
            <h2 className="text-xl font-bold mb-2">Choose Station Type</h2>
            <p className="text-sm text-muted mb-6">
              Select the station workflow you want to use for this station setup.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {choiceTargets.map((target) => (
                <button
                  key={target}
                  onClick={() => navigate(stationCreationTargetPath(target))}
                  className="rounded-xl border border-border p-5 text-left hover:bg-panel transition-colors"
                >
                  <div className="text-base font-semibold">{targetLabel(target)}</div>
                  <div className="text-sm text-muted mt-1">{targetDescription(target)}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
