import { useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { useAuthStore } from '@/core/auth/authStore'
import { getErrorMessage } from '@/core/api/errors'
import { ProviderCompliancePanel } from '@/modules/integrations/components/ProviderCompliancePanel'
import {
  useProviderComplianceStatus,
  useProviderRelationships,
  useProviderRequirements,
  useProviderSettlementSummary,
  useRespondToProviderRelationship,
  useProviderDocuments,
} from '@/modules/integrations/useProviders'

function formatCurrency(value?: number, currency = 'USD'): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
}

export function ProviderPortal() {
  const { user } = useAuthStore()
  const isProviderUser = user?.role === 'SWAP_PROVIDER_ADMIN' || user?.role === 'SWAP_PROVIDER_OPERATOR'

  const { data: relationships = [], isLoading: relationshipsLoading, error: relationshipsError } = useProviderRelationships({ my: true })
  const { data: settlement, isLoading: settlementLoading } = useProviderSettlementSummary({ my: true })
  const { data: documents = [] } = useProviderDocuments({ my: true })
  const { data: requirements = [] } = useProviderRequirements({ appliesTo: 'PROVIDER' })
  const respondMutation = useRespondToProviderRelationship()

  const currentProviderId = useMemo(() => {
    if (user?.providerId) return user.providerId
    if (relationships.length > 0) return relationships[0].providerId
    const providerDoc = documents.find((doc) => doc.providerId)
    return providerDoc?.providerId || ''
  }, [documents, relationships, user?.providerId])

  const { data: complianceStatus } = useProviderComplianceStatus(currentProviderId, {
    enabled: Boolean(currentProviderId),
  })

  const pendingRequests = useMemo(
    () => relationships.filter((item) => item.status === 'REQUESTED'),
    [relationships],
  )
  const activeContracts = useMemo(
    () => relationships.filter((item) => item.status === 'ACTIVE').length,
    [relationships],
  )

  const remediationItems = useMemo(() => {
    if (!complianceStatus) return []
    const missingCritical = complianceStatus.missingCritical.map((code) => ({
      id: `critical-${code}`,
      label: requirements.find((item) => item.requirementCode === code)?.title || code,
      severity: 'critical' as const,
    }))
    const missingRecommended = complianceStatus.missingRecommended.map((code) => ({
      id: `recommended-${code}`,
      label: requirements.find((item) => item.requirementCode === code)?.title || code,
      severity: 'recommended' as const,
    }))
    const expiring = complianceStatus.expiringSoon.map((doc) => ({
      id: `expiring-${doc.id}`,
      label: `${doc.name}${doc.expiryDate ? ` (expires ${doc.expiryDate})` : ''}`,
      severity: 'warning' as const,
    }))
    return [...missingCritical, ...missingRecommended, ...expiring]
  }, [complianceStatus, requirements])

  if (!isProviderUser) {
    return (
      <DashboardLayout pageTitle="Provider Portal">
        <div className="p-8 text-center text-subtle">No permission to view Provider Portal.</div>
      </DashboardLayout>
    )
  }

  if (relationshipsError) {
    return (
      <DashboardLayout pageTitle="Provider Portal">
        <div className="p-8 text-center bg-red-500/5 rounded-2xl border border-red-500/10">
          <p className="text-red-500 font-bold">Failed to load provider portal data</p>
          <p className="text-text-secondary text-sm mt-1">{getErrorMessage(relationshipsError)}</p>
        </div>
      </DashboardLayout>
    )
  }

  const loading = relationshipsLoading || settlementLoading

  return (
    <DashboardLayout pageTitle="Provider Portal">
      <div className="space-y-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-text-secondary">Active Contracts</div>
            <div className="mt-2 text-2xl font-black text-text">{loading ? '...' : activeContracts}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-text-secondary">Pending Requests</div>
            <div className="mt-2 text-2xl font-black text-text">{loading ? '...' : pendingRequests.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-text-secondary">Receivables</div>
            <div className="mt-2 text-2xl font-black text-text">
              {loading ? '...' : formatCurrency(settlement?.totals.receivables, settlement?.currency)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-text-secondary">Compliance Blockers</div>
            <div className="mt-2 text-2xl font-black text-text">
              {loading ? '...' : (complianceStatus?.missingCritical.length || 0) + (complianceStatus?.expiredCritical.length || 0)}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-black text-text mb-3">Contract Requests</h2>
          {!pendingRequests.length ? (
            <div className="text-sm text-text-secondary">No pending contract requests.</div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <div>
                    <div className="font-bold text-text">{request.ownerOrgName || request.ownerOrgId}</div>
                    <div className="text-xs text-text-secondary">Requested {new Date(request.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-60"
                      disabled={respondMutation.isPending}
                      onClick={() => respondMutation.mutate({ id: request.id, action: 'ACCEPT' })}
                    >
                      Accept
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
                      disabled={respondMutation.isPending}
                      onClick={() => respondMutation.mutate({ id: request.id, action: 'REJECT' })}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-base font-black text-text mb-3">Compliance</h3>
            <ProviderCompliancePanel compliance={complianceStatus} requirements={requirements} compact />
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary mb-2">Remediation Queue</div>
              {remediationItems.length === 0 ? (
                <div className="text-sm text-text-secondary">No remediation items pending.</div>
              ) : (
                <div className="space-y-2">
                  {remediationItems.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm rounded-lg bg-panel/30 border border-border px-3 py-2">
                      <span className="text-text">{item.label}</span>
                      <span className="text-xs text-text-secondary uppercase">{item.severity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary mb-2">Uploaded Documents</div>
              {documents.length === 0 ? (
                <div className="text-sm text-text-secondary">No compliance documents uploaded yet.</div>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 6).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-sm rounded-lg bg-panel/30 border border-border px-3 py-2">
                      <span className="text-text">{doc.requirementCode || doc.type}</span>
                      <span className="text-text-secondary">{doc.verificationStatus || doc.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-black text-text mb-3">Settlement Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Gross</span>
                <span className="font-semibold text-text">{formatCurrency(settlement?.totals.gross, settlement?.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Platform Fee</span>
                <span className="font-semibold text-text">{formatCurrency(settlement?.totals.platformFee, settlement?.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Adjustments</span>
                <span className="font-semibold text-text">{formatCurrency(settlement?.totals.adjustments, settlement?.currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
                <span className="text-text font-semibold">Net Payable</span>
                <span className="font-black text-text">{formatCurrency(settlement?.totals.netPayable, settlement?.currency)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
