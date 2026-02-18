import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { getErrorMessage } from '@/core/api/errors'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { logAuditEvent } from '@/core/utils/auditLogger'
import type {
  ProviderComplianceGate,
  ProviderComplianceStatus,
  ProviderDocument,
  ProviderDocumentStatus,
  ProviderDocumentType,
  ProviderRequirementDefinition,
  ProviderStandard,
} from '@/core/api/types'
import { ProviderCompliancePanel } from '@/modules/integrations/components/ProviderCompliancePanel'
import { evaluateProviderCompliance } from '@/modules/integrations/providerCompliance'
import {
  normalizeProviderStatus,
  type NormalizedProviderStatus,
} from '@/modules/integrations/providerStatus'
import {
  useApproveProvider,
  useApproveProviderRelationship,
  useCreateProvider,
  useProviderComplianceStatus,
  useProviderDocuments,
  useProviderRequirements,
  useProviderRelationships,
  useProviders,
  useRejectProvider,
  useReviewProviderDocument,
  useSubmitProviderForReview,
  useSuspendProvider,
  useSuspendProviderRelationship,
  useUploadProviderDocument,
} from '@/modules/integrations/useProviders'

const DOC_TYPES: ProviderDocumentType[] = [
  'INCORPORATION',
  'TAX_COMPLIANCE',
  'INSURANCE',
  'BATTERY_SAFETY_CERTIFICATION',
  'RECYCLING_COMPLIANCE',
  'TECHNICAL_CONFORMANCE',
  'COMMERCIAL_AGREEMENT',
  'SOP_ACKNOWLEDGEMENT',
  'SITE_COMPATIBILITY_DECLARATION',
]

type TabKey = 'directory' | 'queue' | 'compliance' | 'contracts'
const GATE_ORDER: ProviderComplianceGate[] = ['KYB', 'SAFETY', 'OPERATIONS', 'INTEGRATION']

function statusColor(status: NormalizedProviderStatus): string {
  if (status === 'APPROVED') return 'bg-green-500/10 text-green-500'
  if (status === 'PENDING_REVIEW') return 'bg-yellow-500/10 text-yellow-500'
  if (status === 'SUSPENDED') return 'bg-red-500/10 text-red-500'
  if (status === 'REJECTED') return 'bg-rose-500/10 text-rose-500'
  if (status === 'UNKNOWN') return 'bg-slate-500/10 text-slate-500'
  return 'bg-blue-500/10 text-blue-500'
}

function verificationState(document: ProviderDocument): 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' {
  if (document.verificationStatus) return document.verificationStatus
  if (document.status === 'APPROVED') return 'VERIFIED'
  if (document.status === 'REJECTED') return 'REJECTED'
  return 'UNVERIFIED'
}

function verificationStateClass(status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED'): string {
  if (status === 'VERIFIED') return 'bg-green-500/10 text-green-500'
  if (status === 'REJECTED') return 'bg-rose-500/10 text-rose-500'
  return 'bg-amber-500/10 text-amber-500'
}

function requirementTitle(code: string, requirements: ProviderRequirementDefinition[]): string {
  return requirements.find((item) => item.requirementCode === code)?.title || code
}

function complianceBlockerCount(status?: ProviderComplianceStatus): number {
  if (!status) return 0
  return status.missingCritical.length + status.expiredCritical.length
}

export function SwapProviders() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'swapProviders')
  const canManage = Boolean(perms.create || perms.edit)
  const canApprove = Boolean(perms.approve)
  const canSuspend = Boolean(perms.suspend)

  const [tab, setTab] = useState<TabKey>('directory')
  const [q, setQ] = useState('')
  const [regionFilter, setRegionFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    legalName: '',
    registrationNumber: '',
    taxId: '',
    contactEmail: '',
    region: '',
    standard: 'Universal',
    batteriesSupported: '',
    feeModel: '',
    settlementTerms: '',
  })
  const [docForm, setDocForm] = useState({
    providerId: '',
    requirementCode: '',
    type: 'INCORPORATION' as ProviderDocumentType,
    name: '',
    fileUrl: '',
    issuer: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    version: '',
  })

  const createProviderMutation = useCreateProvider()
  const submitForReviewMutation = useSubmitProviderForReview()
  const approveProviderMutation = useApproveProvider()
  const rejectProviderMutation = useRejectProvider()
  const suspendProviderMutation = useSuspendProvider()
  const uploadDocumentMutation = useUploadProviderDocument()
  const reviewDocumentMutation = useReviewProviderDocument()
  const approveRelationshipMutation = useApproveProviderRelationship()
  const suspendRelationshipMutation = useSuspendProviderRelationship()

  const { data: providers = [], isLoading, error } = useProviders({
    region: regionFilter !== 'All' ? regionFilter : undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
  })
  const { data: requirements = [] } = useProviderRequirements({ appliesTo: 'PROVIDER' })
  const { data: relationships = [], isLoading: relationshipsLoading } = useProviderRelationships()
  const { data: documents = [], isLoading: documentsLoading } = useProviderDocuments()
  const { data: selectedComplianceRemote } = useProviderComplianceStatus(selectedProviderId, {
    enabled: Boolean(selectedProviderId),
  })

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const search = q.toLowerCase()
      const providerStatus = normalizeProviderStatus(provider.status)
      const matchSearch =
        provider.name.toLowerCase().includes(search) ||
        provider.region.toLowerCase().includes(search) ||
        provider.standard.toLowerCase().includes(search)
      const matchStatus = statusFilter === 'All' || providerStatus === statusFilter
      const matchRegion = regionFilter === 'All' || provider.region.includes(regionFilter)
      return matchSearch && matchStatus && matchRegion
    })
  }, [providers, q, statusFilter, regionFilter])

  const regions = useMemo(() => {
    const unique = new Set(providers.map((p) => p.region.split(' (')[0]))
    return ['All', ...Array.from(unique)]
  }, [providers])

  const queueProviders = useMemo(
    () => filteredProviders.filter((provider) => normalizeProviderStatus(provider.status) === 'PENDING_REVIEW'),
    [filteredProviders],
  )

  const documentsByProvider = useMemo(() => {
    return documents.reduce<Map<string, ProviderDocument[]>>((acc, document) => {
      const providerId = document.providerId || 'unknown'
      if (!acc.has(providerId)) {
        acc.set(providerId, [])
      }
      acc.get(providerId)?.push(document)
      return acc
    }, new Map<string, ProviderDocument[]>())
  }, [documents])

  const complianceByProvider = useMemo(() => {
    return providers.reduce<Map<string, ProviderComplianceStatus>>((acc, provider) => {
      const providerDocuments = documentsByProvider.get(provider.id) || []
      acc.set(
        provider.id,
        evaluateProviderCompliance({
          providerId: provider.id,
          provider,
          documents: providerDocuments,
          requirements,
        }),
      )
      return acc
    }, new Map<string, ProviderComplianceStatus>())
  }, [providers, documentsByProvider, requirements])

  const selectedCompliance = selectedComplianceRemote || complianceByProvider.get(selectedProviderId) || null
  const selectedProviderDocuments = selectedProviderId ? documentsByProvider.get(selectedProviderId) || [] : []
  const requirementIndex = useMemo(
    () => new Map(requirements.map((requirement) => [requirement.requirementCode, requirement])),
    [requirements],
  )
  const checklistByGate = useMemo(() => {
    return GATE_ORDER.map((gate) => ({
      gate,
      requirements: requirements.filter((item) => item.gate === gate),
    }))
  }, [requirements])

  useEffect(() => {
    if (!selectedProviderId && providers.length > 0) {
      const initialProviderId = providers[0].id
      setSelectedProviderId(initialProviderId)
      setDocForm((prev) => ({ ...prev, providerId: initialProviderId }))
      return
    }
    if (selectedProviderId && providers.length > 0 && !providers.some((provider) => provider.id === selectedProviderId)) {
      const fallbackProviderId = providers[0].id
      setSelectedProviderId(fallbackProviderId)
      setDocForm((prev) => ({ ...prev, providerId: fallbackProviderId }))
    }
  }, [providers, selectedProviderId])

  if (!perms.access) {
    return (
      <DashboardLayout pageTitle="Swapping Providers">
        <div className="p-8 text-center text-subtle">No permission to access swap provider governance.</div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Swapping Providers">
        <div className="p-8 text-center bg-red-500/5 rounded-2xl border border-red-500/10">
          <p className="text-red-500 font-bold">Failed to load providers</p>
          <p className="text-text-secondary text-sm mt-1">{getErrorMessage(error)}</p>
        </div>
      </DashboardLayout>
    )
  }

  const handleCreateProvider = async () => {
    const name = createForm.name.trim()
    const region = createForm.region.trim()
    if (!name || !region) return

    await createProviderMutation.mutateAsync({
      name,
      legalName: createForm.legalName.trim() || undefined,
      registrationNumber: createForm.registrationNumber.trim() || undefined,
      taxId: createForm.taxId.trim() || undefined,
      contactEmail: createForm.contactEmail.trim() || undefined,
      region,
      standard: createForm.standard as ProviderStandard,
      batteriesSupported: createForm.batteriesSupported.split(',').map((token) => token.trim()).filter(Boolean),
      feeModel: createForm.feeModel.trim() || undefined,
      settlementTerms: createForm.settlementTerms.trim() || undefined,
    })
    logAuditEvent({
      category: 'Config',
      action: 'Swap provider created',
      target: name,
      details: 'Created provider record from onboarding form',
      severity: 'Info',
    })
    setShowCreateForm(false)
    setCreateForm({
      name: '',
      legalName: '',
      registrationNumber: '',
      taxId: '',
      contactEmail: '',
      region: '',
      standard: 'Universal',
      batteriesSupported: '',
      feeModel: '',
      settlementTerms: '',
    })
  }

  const handleUploadDocument = async () => {
    if (!docForm.providerId || !docForm.fileUrl.trim() || !docForm.name.trim()) return
    await uploadDocumentMutation.mutateAsync({
      providerId: docForm.providerId,
      type: docForm.type,
      requirementCode: docForm.requirementCode || undefined,
      name: docForm.name.trim(),
      fileUrl: docForm.fileUrl.trim(),
      issuer: docForm.issuer.trim() || undefined,
      documentNumber: docForm.documentNumber.trim() || undefined,
      issueDate: docForm.issueDate || undefined,
      expiryDate: docForm.expiryDate || undefined,
      version: docForm.version.trim() || undefined,
      metadata: {
        source: 'provider-compliance-v1',
      },
    })
    setDocForm((prev) => ({
      ...prev,
      name: '',
      fileUrl: '',
      issuer: '',
      documentNumber: '',
      issueDate: '',
      expiryDate: '',
      version: '',
    }))
  }

  const handleApproveProvider = async (providerId: string, providerName: string) => {
    const compliance = complianceByProvider.get(providerId)
    if (compliance && complianceBlockerCount(compliance) > 0) return
    await approveProviderMutation.mutateAsync({ id: providerId })
    logAuditEvent({
      category: 'Config',
      action: 'Provider approved',
      target: providerId,
      details: providerName,
    })
  }

  const handleReviewDocument = async (document: ProviderDocument, status: ProviderDocumentStatus) => {
    const notes = (reviewNotes[document.id] || '').trim()
    if (status === 'REJECTED' && !notes) {
      setReviewError('Rejection requires review notes.')
      return
    }
    setReviewError('')
    await reviewDocumentMutation.mutateAsync({
      id: document.id,
      status,
      reviewedBy: user?.id,
      reviewNotes: notes || undefined,
      rejectionReason: status === 'REJECTED' ? notes : undefined,
    })
    setReviewNotes((prev) => ({ ...prev, [document.id]: '' }))
  }

  return (
    <DashboardLayout pageTitle="Battery Swap Providers">
      <div className="flex flex-col gap-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-text tracking-tight">Provider Governance</h2>
            <p className="text-text-secondary text-sm">Admin-controlled onboarding, compliance, contracts and lifecycle status.</p>
          </div>
          {canManage && (
            <button
              className="px-6 py-2.5 bg-accent text-white font-black text-sm rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
              onClick={() => setShowCreateForm((prev) => !prev)}
            >
              Register New Provider
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <TabButton active={tab === 'directory'} onClick={() => setTab('directory')} label="Directory" />
          <TabButton active={tab === 'queue'} onClick={() => setTab('queue')} label="Onboarding Queue" />
          <TabButton active={tab === 'compliance'} onClick={() => setTab('compliance')} label="Compliance" />
          <TabButton active={tab === 'contracts'} onClick={() => setTab('contracts')} label="Contracts" />
        </div>

        {showCreateForm && (
          <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-panel/50 border-border">
            <input className="input" placeholder="Provider name *" value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} />
            <input className="input" placeholder="Legal name" value={createForm.legalName} onChange={(e) => setCreateForm((s) => ({ ...s, legalName: e.target.value }))} />
            <input className="input" placeholder="Registration no." value={createForm.registrationNumber} onChange={(e) => setCreateForm((s) => ({ ...s, registrationNumber: e.target.value }))} />
            <input className="input" placeholder="Tax ID" value={createForm.taxId} onChange={(e) => setCreateForm((s) => ({ ...s, taxId: e.target.value }))} />
            <input className="input" placeholder="Contact email" value={createForm.contactEmail} onChange={(e) => setCreateForm((s) => ({ ...s, contactEmail: e.target.value }))} />
            <input className="input" placeholder="Region *" value={createForm.region} onChange={(e) => setCreateForm((s) => ({ ...s, region: e.target.value }))} />
            <input className="input" placeholder="Provider standard" value={createForm.standard} onChange={(e) => setCreateForm((s) => ({ ...s, standard: e.target.value }))} />
            <input className="input" placeholder="Supported batteries (comma separated)" value={createForm.batteriesSupported} onChange={(e) => setCreateForm((s) => ({ ...s, batteriesSupported: e.target.value }))} />
            <input className="input" placeholder="Fee model" value={createForm.feeModel} onChange={(e) => setCreateForm((s) => ({ ...s, feeModel: e.target.value }))} />
            <input className="input" placeholder="Settlement terms" value={createForm.settlementTerms} onChange={(e) => setCreateForm((s) => ({ ...s, settlementTerms: e.target.value }))} />
            <div className="md:col-span-2 flex justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-accent text-white font-semibold disabled:opacity-60"
                disabled={createProviderMutation.isPending}
                onClick={handleCreateProvider}
              >
                {createProviderMutation.isPending ? 'Saving...' : 'Create Provider'}
              </button>
            </div>
          </Card>
        )}

        <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 border-white/5 shadow-none">
          <input
            type="text"
            placeholder="Search providers, standards or regions..."
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="select"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </Card>

        {tab === 'directory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <Card key={i} className="h-[240px] animate-pulse bg-white/5 border-white/5"><div className="w-full h-full" /></Card>
              ))
            ) : (
              filteredProviders.map((provider) => {
                const status = normalizeProviderStatus(provider.status)
                const compliance = complianceByProvider.get(provider.id)
                const blockerCount = complianceBlockerCount(compliance)
                return (
                  <Card key={provider.id} className="p-5 space-y-4 border-white/5 bg-white/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-black text-text">{provider.name}</h3>
                        <p className="text-xs uppercase tracking-wide text-text-secondary">{provider.region}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${statusColor(status)}`}>{status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-border bg-panel/30 p-2">
                        <div className="text-text-secondary uppercase tracking-wide">Standard</div>
                        <div className="text-text font-semibold mt-1">{provider.standard}</div>
                      </div>
                      <div className="rounded-lg border border-border bg-panel/30 p-2">
                        <div className="text-text-secondary uppercase tracking-wide">Stations</div>
                        <div className="text-text font-semibold mt-1">{provider.stationCount.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="text-xs text-text-secondary">
                      Compliance: {compliance?.overallState || 'READY'}
                      {blockerCount > 0 ? ` · ${blockerCount} blocker(s)` : ''}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {provider.batteriesSupported.slice(0, 4).map((battery) => (
                        <span key={battery} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-text-secondary">{battery}</span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canManage && status === 'DRAFT' && (
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white disabled:opacity-60"
                          disabled={submitForReviewMutation.isPending}
                          onClick={async () => {
                            await submitForReviewMutation.mutateAsync(provider.id)
                            logAuditEvent({
                              category: 'Config',
                              action: 'Provider submitted for review',
                              target: provider.id,
                              details: provider.name,
                            })
                          }}
                        >
                          Submit Review
                        </button>
                      )}
                      {canApprove && status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white disabled:opacity-60"
                            disabled={approveProviderMutation.isPending || blockerCount > 0}
                            title={blockerCount > 0 ? 'Resolve critical compliance blockers before approval.' : undefined}
                            onClick={() => handleApproveProvider(provider.id, provider.name)}
                          >
                            Approve
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white disabled:opacity-60"
                            disabled={rejectProviderMutation.isPending}
                            onClick={() => rejectProviderMutation.mutate({ id: provider.id, reason: 'Rejected during compliance review' })}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {canSuspend && status === 'APPROVED' && (
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white disabled:opacity-60"
                          disabled={suspendProviderMutation.isPending}
                          onClick={() =>
                            suspendProviderMutation.mutate({
                              id: provider.id,
                              reason: compliance?.expiredCritical.length ? 'DOC_EXPIRED_CRITICAL' : 'Suspended by platform ops',
                            })
                          }
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {tab === 'queue' && (
          <Card className="p-5">
            <h3 className="text-lg font-black text-text mb-3">Onboarding Queue</h3>
            {queueProviders.length === 0 ? (
              <p className="text-sm text-text-secondary">No providers pending review.</p>
            ) : (
              <div className="space-y-2">
                {queueProviders.map((provider) => {
                  const compliance = complianceByProvider.get(provider.id)
                  const blockerCount = complianceBlockerCount(compliance)
                  return (
                    <div key={provider.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                      <div>
                        <div className="font-semibold text-text">{provider.name}</div>
                        <div className="text-xs text-text-secondary">{provider.region} • {provider.standard}</div>
                        <div className="text-xs text-text-secondary">
                          Compliance: {compliance?.overallState || 'READY'}
                          {blockerCount > 0 ? ` · ${blockerCount} critical blocker(s)` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canApprove && (
                          <button
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white disabled:opacity-60"
                            disabled={approveProviderMutation.isPending || blockerCount > 0}
                            title={blockerCount > 0 ? 'Provider has unresolved critical compliance gaps.' : undefined}
                            onClick={() => handleApproveProvider(provider.id, provider.name)}
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        {tab === 'compliance' && (
          <div className="space-y-4">
            <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-text-secondary">Selected Provider</div>
                <select
                  className="select"
                  value={selectedProviderId}
                  onChange={(e) => {
                    setSelectedProviderId(e.target.value)
                    setDocForm((prev) => ({ ...prev, providerId: e.target.value }))
                  }}
                >
                  <option value="">Choose Provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg border border-border px-3 py-2">
                  <div className="text-text-secondary">Critical</div>
                  <div className="font-semibold text-text">
                    {selectedCompliance
                      ? selectedCompliance.gateStatuses.reduce((total, item) => total + item.criticalMet, 0)
                      : 0}
                    /
                    {selectedCompliance
                      ? selectedCompliance.gateStatuses.reduce((total, item) => total + item.criticalRequired, 0)
                      : 0}
                  </div>
                </div>
                <div className="rounded-lg border border-border px-3 py-2">
                  <div className="text-text-secondary">Recommended</div>
                  <div className="font-semibold text-text">
                    {selectedCompliance ? selectedCompliance.missingRecommended.length : 0} missing
                  </div>
                </div>
                <div className="rounded-lg border border-border px-3 py-2">
                  <div className="text-text-secondary">Expiring</div>
                  <div className="font-semibold text-text">{selectedCompliance?.expiringSoon.length || 0}</div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="text-lg font-black text-text mb-3">Upload Compliance Document</h3>
                <div className="space-y-3">
                  <select
                    className="select"
                    value={docForm.requirementCode}
                    onChange={(e) => {
                      const requirementCode = e.target.value
                      const requirement = requirementIndex.get(requirementCode)
                      setDocForm((prev) => ({
                        ...prev,
                        requirementCode,
                        type: requirement?.acceptedDocTypes[0] || prev.type,
                        name: requirement ? requirement.title : prev.name,
                      }))
                    }}
                  >
                    <option value="">Select Requirement</option>
                    {requirements.map((requirement) => (
                      <option key={requirement.requirementCode} value={requirement.requirementCode}>
                        {requirement.gate} • {requirement.title}
                      </option>
                    ))}
                  </select>
                  <select className="select" value={docForm.type} onChange={(e) => setDocForm((s) => ({ ...s, type: e.target.value as ProviderDocumentType }))}>
                    {DOC_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <input className="input" placeholder="Document name" value={docForm.name} onChange={(e) => setDocForm((s) => ({ ...s, name: e.target.value }))} />
                  <input className="input" placeholder="File URL" value={docForm.fileUrl} onChange={(e) => setDocForm((s) => ({ ...s, fileUrl: e.target.value }))} />
                  <input className="input" placeholder="Issuer" value={docForm.issuer} onChange={(e) => setDocForm((s) => ({ ...s, issuer: e.target.value }))} />
                  <input className="input" placeholder="Document number" value={docForm.documentNumber} onChange={(e) => setDocForm((s) => ({ ...s, documentNumber: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input" type="date" value={docForm.issueDate} onChange={(e) => setDocForm((s) => ({ ...s, issueDate: e.target.value }))} />
                    <input className="input" type="date" value={docForm.expiryDate} onChange={(e) => setDocForm((s) => ({ ...s, expiryDate: e.target.value }))} />
                  </div>
                  <input className="input" placeholder="Version" value={docForm.version} onChange={(e) => setDocForm((s) => ({ ...s, version: e.target.value }))} />
                  <button
                    className="px-4 py-2 rounded-lg bg-accent text-white font-semibold disabled:opacity-60"
                    disabled={uploadDocumentMutation.isPending || !docForm.providerId}
                    onClick={handleUploadDocument}
                  >
                    Upload
                  </button>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-lg font-black text-text mb-3">Compliance Gates</h3>
                <ProviderCompliancePanel compliance={selectedCompliance} requirements={requirements} />
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="text-lg font-black text-text mb-3">Gate Checklist</h3>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {checklistByGate.map((group) => (
                    <div key={group.gate} className="rounded-lg border border-border p-3">
                      <div className="text-xs uppercase tracking-wide text-text-secondary mb-2">{group.gate}</div>
                      <div className="space-y-2">
                        {group.requirements.map((requirement) => {
                          const isCriticalMissing = selectedCompliance?.missingCritical.includes(requirement.requirementCode)
                          const isRecommendedMissing = selectedCompliance?.missingRecommended.includes(requirement.requirementCode)
                          const state = isCriticalMissing ? 'MISSING_CRITICAL' : isRecommendedMissing ? 'MISSING' : 'MET'
                          const stateClass = state === 'MET'
                            ? 'bg-green-500/10 text-green-500'
                            : state === 'MISSING'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-red-500/10 text-red-500'
                          return (
                            <div key={requirement.requirementCode} className="flex items-start justify-between gap-3 text-sm">
                              <div>
                                <div className="font-medium text-text">{requirement.title}</div>
                                <div className="text-xs text-text-secondary">{requirement.acceptedDocTypes.join(', ')}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${stateClass}`}>
                                {state === 'MISSING_CRITICAL' ? 'CRITICAL GAP' : state}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-lg font-black text-text mb-3">Documents</h3>
                {reviewError && (
                  <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">
                    {reviewError}
                  </div>
                )}
                {documentsLoading ? (
                  <p className="text-sm text-text-secondary">Loading documents...</p>
                ) : selectedProviderDocuments.length === 0 ? (
                  <p className="text-sm text-text-secondary">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {selectedProviderDocuments.map((doc) => {
                      const verification = verificationState(doc)
                      return (
                        <div key={doc.id} className="rounded-lg border border-border p-3 text-sm space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-text">{doc.name}</div>
                              <div className="text-xs text-text-secondary">
                                {doc.requirementCode ? requirementTitle(doc.requirementCode, requirements) : doc.type}
                              </div>
                              <div className="text-xs text-text-secondary mt-1">
                                {doc.issueDate ? `Issue: ${doc.issueDate}` : 'Issue date not set'}
                                {doc.expiryDate ? ` • Expiry: ${doc.expiryDate}` : ''}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-semibold ${verificationStateClass(verification)}`}>
                              {verification}
                            </span>
                          </div>

                          {canApprove && (
                            <div className="space-y-2">
                              <textarea
                                className="w-full rounded-lg border border-border bg-panel px-2 py-1 text-xs text-text"
                                rows={2}
                                placeholder="Reviewer notes"
                                value={reviewNotes[doc.id] || ''}
                                onChange={(e) => setReviewNotes((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                              />
                              <div className="flex gap-2">
                                <button
                                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-600 text-white disabled:opacity-60"
                                  disabled={reviewDocumentMutation.isPending}
                                  onClick={() => handleReviewDocument(doc, 'APPROVED')}
                                >
                                  Verify
                                </button>
                                <button
                                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white disabled:opacity-60"
                                  disabled={reviewDocumentMutation.isPending}
                                  onClick={() => handleReviewDocument(doc, 'REJECTED')}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {tab === 'contracts' && (
          <Card className="p-5">
            <h3 className="text-lg font-black text-text mb-3">Owner-Provider Contracts</h3>
            {relationshipsLoading ? (
              <p className="text-sm text-text-secondary">Loading contracts...</p>
            ) : relationships.length === 0 ? (
              <p className="text-sm text-text-secondary">No owner-provider relationships found.</p>
            ) : (
              <div className="space-y-2">
                {relationships.map((relationship) => (
                  <div key={relationship.id} className="rounded-lg border border-border p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-text">{relationship.ownerOrgName || relationship.ownerOrgId}</div>
                      <div className="text-xs text-text-secondary">Provider {relationship.providerName || relationship.providerId}</div>
                      <div className="text-xs text-text-secondary">{relationship.status}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canApprove && relationship.status === 'DOCS_PENDING' && (
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white disabled:opacity-60"
                          disabled={approveRelationshipMutation.isPending || complianceBlockerCount(complianceByProvider.get(relationship.providerId)) > 0}
                          onClick={() => approveRelationshipMutation.mutate({ id: relationship.id })}
                        >
                          Approve
                        </button>
                      )}
                      {canSuspend && relationship.status === 'ACTIVE' && (
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white disabled:opacity-60"
                          disabled={suspendRelationshipMutation.isPending}
                          onClick={() => suspendRelationshipMutation.mutate({ id: relationship.id })}
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-accent text-white' : 'bg-panel text-text-secondary hover:text-text'}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
