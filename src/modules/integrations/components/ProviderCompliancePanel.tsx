import type { ProviderComplianceStatus, ProviderRequirementDefinition } from '@/core/api/types'

type ProviderCompliancePanelProps = {
  compliance?: ProviderComplianceStatus | null
  requirements?: ProviderRequirementDefinition[]
  compact?: boolean
}

function statusClass(status: ProviderComplianceStatus['overallState']) {
  if (status === 'READY') return 'bg-green-500/10 text-green-500'
  if (status === 'WARN') return 'bg-amber-500/10 text-amber-500'
  return 'bg-red-500/10 text-red-500'
}

function gateClass(status: 'PASS' | 'WARN' | 'BLOCKED') {
  if (status === 'PASS') return 'text-green-500'
  if (status === 'WARN') return 'text-amber-500'
  return 'text-red-500'
}

function requirementTitle(code: string, requirements: ProviderRequirementDefinition[]): string {
  return requirements.find((item) => item.requirementCode === code)?.title || code
}

export function ProviderCompliancePanel({ compliance, requirements = [], compact = false }: ProviderCompliancePanelProps) {
  if (!compliance) {
    return <div className="text-sm text-text-secondary">Compliance status unavailable.</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusClass(compliance.overallState)}`}>
          {compliance.overallState}
        </span>
        <span className="text-xs text-text-secondary">
          Missing critical: {compliance.missingCritical.length}
        </span>
        <span className="text-xs text-text-secondary">
          Missing recommended: {compliance.missingRecommended.length}
        </span>
        <span className="text-xs text-text-secondary">Expiring soon: {compliance.expiringSoon.length}</span>
        <span className="text-xs text-text-secondary">Policy warnings: {compliance.policyWarnings?.length || 0}</span>
      </div>

      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {compliance.gateStatuses.map((gate) => (
          <div key={gate.gate} className="rounded-lg border border-border px-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-text">{gate.gate}</span>
              <span className={`font-semibold ${gateClass(gate.status)}`}>{gate.status}</span>
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Critical {gate.criticalMet}/{gate.criticalRequired} · Total {gate.met}/{gate.required}
            </div>
          </div>
        ))}
      </div>

      {compliance.missingCritical.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-1">Critical Gaps</div>
          <ul className="text-sm text-text space-y-1">
            {compliance.missingCritical.slice(0, compact ? 3 : 6).map((code) => (
              <li key={code}>{requirementTitle(code, requirements)}</li>
            ))}
          </ul>
        </div>
      )}

      {(compliance.pendingActivation?.length || 0) > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-500 mb-1">Pending Activation</div>
          <ul className="text-sm text-text space-y-1">
            {(compliance.pendingActivation || []).slice(0, compact ? 3 : 6).map((code) => (
              <li key={code}>{requirementTitle(code, requirements)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
