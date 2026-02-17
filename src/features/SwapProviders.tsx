import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { getErrorMessage } from '@/core/api/errors'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { logAuditEvent } from '@/core/utils/auditLogger'
import type { ProviderDocumentType, ProviderStandard } from '@/core/api/types'
import {
  useApproveProvider,
  useApproveProviderRelationship,
  useCreateProvider,
  useProviderDocuments,
  useProviderRelationships,
  useProviders,
  useRejectProvider,
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

function normalizeProviderStatus(value?: string): string {
  const normalized = (value ?? '').toUpperCase()
  if (normalized === 'ACTIVE') return 'APPROVED'
  if (normalized === 'PENDING') return 'PENDING_REVIEW'
  if (normalized === 'INACTIVE') return 'SUSPENDED'
  return normalized || 'DRAFT'
}

function statusColor(status: string): string {
  if (status === 'APPROVED' || status === 'ACTIVE') return 'bg-green-500/10 text-green-500'
  if (status === 'PENDING_REVIEW' || status === 'PENDING') return 'bg-yellow-500/10 text-yellow-500'
  if (status === 'SUSPENDED') return 'bg-red-500/10 text-red-500'
  if (status === 'REJECTED') return 'bg-rose-500/10 text-rose-500'
  return 'bg-blue-500/10 text-blue-500'
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
    type: 'INCORPORATION' as ProviderDocumentType,
    name: '',
    fileUrl: '',
  })

  const createProviderMutation = useCreateProvider()
  const submitForReviewMutation = useSubmitProviderForReview()
  const approveProviderMutation = useApproveProvider()
  const rejectProviderMutation = useRejectProvider()
  const suspendProviderMutation = useSuspendProvider()
  const uploadDocumentMutation = useUploadProviderDocument()
  const approveRelationshipMutation = useApproveProviderRelationship()
  const suspendRelationshipMutation = useSuspendProviderRelationship()

  const { data: providers = [], isLoading, error } = useProviders({
    region: regionFilter !== 'All' ? regionFilter : undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
  })
  const { data: relationships = [], isLoading: relationshipsLoading } = useProviderRelationships()
  const { data: documents = [], isLoading: documentsLoading } = useProviderDocuments()

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
      name: docForm.name.trim(),
      fileUrl: docForm.fileUrl.trim(),
    })
    setDocForm((prev) => ({ ...prev, name: '', fileUrl: '' }))
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
                            disabled={approveProviderMutation.isPending}
                            onClick={async () => {
                              await approveProviderMutation.mutateAsync({ id: provider.id })
                              logAuditEvent({
                                category: 'Config',
                                action: 'Provider approved',
                                target: provider.id,
                                details: provider.name,
                              })
                            }}
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
                          onClick={() => suspendProviderMutation.mutate({ id: provider.id, reason: 'Suspended by platform ops' })}
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
                {queueProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div>
                      <div className="font-semibold text-text">{provider.name}</div>
                      <div className="text-xs text-text-secondary">{provider.region} • {provider.standard}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canApprove && (
                        <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white" onClick={() => approveProviderMutation.mutate({ id: provider.id })}>
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === 'compliance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-lg font-black text-text mb-3">Upload Compliance Document</h3>
              <div className="space-y-3">
                <select className="select" value={docForm.providerId} onChange={(e) => setDocForm((s) => ({ ...s, providerId: e.target.value }))}>
                  <option value="">Choose Provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
                </select>
                <select className="select" value={docForm.type} onChange={(e) => setDocForm((s) => ({ ...s, type: e.target.value as ProviderDocumentType }))}>
                  {DOC_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input className="input" placeholder="Document name" value={docForm.name} onChange={(e) => setDocForm((s) => ({ ...s, name: e.target.value }))} />
                <input className="input" placeholder="File URL" value={docForm.fileUrl} onChange={(e) => setDocForm((s) => ({ ...s, fileUrl: e.target.value }))} />
                <button
                  className="px-4 py-2 rounded-lg bg-accent text-white font-semibold disabled:opacity-60"
                  disabled={uploadDocumentMutation.isPending}
                  onClick={handleUploadDocument}
                >
                  Upload
                </button>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-black text-text mb-3">Documents</h3>
              {documentsLoading ? (
                <p className="text-sm text-text-secondary">Loading documents...</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-text-secondary">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <div key={doc.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="font-semibold text-text">{doc.name}</div>
                      <div className="text-xs text-text-secondary">{doc.type}</div>
                      <div className="text-xs text-text-secondary mt-1">{doc.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
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
                          disabled={approveRelationshipMutation.isPending}
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
