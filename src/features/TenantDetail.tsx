import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useTenant, useTenantContract } from '@/core/api/hooks/useTenants'
import { useSendNotice, useNotices } from '@/core/api/hooks/useNotices'
import { SendNoticeModal } from '@/modals/SendNoticeModal'
import { FinancialStatusCard } from '@/ui/components/FinancialStatusCard'
import { getErrorMessage } from '@/core/api/errors'
import type { Tenant, LeaseContract } from '@/core/api/types'

type Tab = 'overview' | 'financial' | 'contract' | 'documents' | 'notices' | 'actions'

export function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const resolveTab = (value: string | null): Tab => {
    if (value === 'financial' || value === 'contract' || value === 'documents' || value === 'notices' || value === 'actions') {
      return value
    }
    return 'overview'
  }
  const [activeTab, setActiveTab] = useState<Tab>(resolveTab(searchParams.get('tab')))
  const [showNoticeModal, setShowNoticeModal] = useState(false)

  const { data: tenant, isLoading, error } = useTenant(id || '')
  const { data: contract, isLoading: contractLoading } = useTenantContract(id || '')
  const { data: notices, isLoading: noticesLoading } = useNotices(id)
  const sendNoticeMutation = useSendNotice()

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Tenant Details">
        <div className="text-center py-8 text-muted">Loading tenant details...</div>
      </DashboardLayout>
    )
  }

  if (error || !tenant) {
    return (
      <DashboardLayout pageTitle="Tenant Details">
        <div className="p-4 bg-danger/10 text-danger rounded-lg">
          {error ? getErrorMessage(error) : 'Tenant not found'}
        </div>
      </DashboardLayout>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'financial', label: 'Financial Status' },
    { id: 'contract', label: 'Contract/Lease' },
    { id: 'documents', label: 'Documents' },
    { id: 'notices', label: 'Notice History' },
    { id: 'actions', label: 'Actions' },
  ]

  return (
    <DashboardLayout pageTitle={`Tenant: ${tenant.name}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <p className="text-muted">{tenant.type} • {tenant.siteName}</p>
          </div>
          <button className="btn secondary" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  const next = new URLSearchParams(searchParams)
                  next.set('tab', tab.id)
                  setSearchParams(next, { replace: true })
                }}
                className={`pb-3 px-1 border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-accent text-accent font-medium'
                  : 'border-transparent text-muted hover:text-text'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="card">
          {activeTab === 'overview' && <OverviewTab tenant={tenant} />}
          {activeTab === 'financial' && <FinancialTab tenant={tenant} />}
          {activeTab === 'contract' && <ContractTab contract={contract} isLoading={contractLoading} />}
          {activeTab === 'documents' && <DocumentsTab tenantId={id!} />}
          {activeTab === 'notices' && <NoticesTab notices={notices} isLoading={noticesLoading} />}
          {activeTab === 'actions' && (
            <ActionsTab
              tenant={tenant}
              onSendNotice={() => setShowNoticeModal(true)}
            />
          )}
        </div>
      </div>

      {showNoticeModal && (
        <SendNoticeModal
          tenantId={tenant.id}
          tenantName={tenant.name}
          onClose={() => setShowNoticeModal(false)}
          onSuccess={() => {
            setShowNoticeModal(false)
            alert('Notice sent successfully')
          }}
        />
      )}
    </DashboardLayout>
  )
}

function OverviewTab({ tenant }: { tenant: Tenant }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Basic Information</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted">Type:</span>
              <span className="ml-2">{tenant.type}</span>
            </div>
            <div>
              <span className="text-sm text-muted">Status:</span>
              <span className={`ml-2 pill ${tenant.status === 'Active' ? 'approved' : tenant.status === 'Pending' ? 'pending' : 'bg-danger/20 text-danger'}`}>
                {tenant.status}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted">Site:</span>
              <span className="ml-2">{tenant.siteName}</span>
            </div>
            <div>
              <span className="text-sm text-muted">Model:</span>
              <span className="ml-2">{tenant.model}</span>
            </div>
            <div>
              <span className="text-sm text-muted">Terms:</span>
              <span className="ml-2">{tenant.terms}</span>
            </div>
            <div>
              <span className="text-sm text-muted">Start Date:</span>
              <span className="ml-2">{new Date(tenant.startDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Contact Information</h3>
          <div className="space-y-2">
            {tenant.email && (
              <div>
                <span className="text-sm text-muted">Email:</span>
                <span className="ml-2">{tenant.email}</span>
              </div>
            )}
            {tenant.phone && (
              <div>
                <span className="text-sm text-muted">Phone:</span>
                <span className="ml-2">{tenant.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FinancialTab({ tenant }: { tenant: Tenant }) {
  return (
    <div className="space-y-6">
      <FinancialStatusCard tenant={tenant} />

      {/* Payment History */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Payment History</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tenant.paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No payment history available
                  </td>
                </tr>
              ) : (
                tenant.paymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td className="font-semibold">${payment.amount.toLocaleString()}</td>
                    <td>{payment.method}</td>
                    <td className="text-muted text-sm">{payment.reference}</td>
                    <td>
                      <span className={`pill ${payment.status === 'completed' ? 'approved' :
                        payment.status === 'pending' ? 'pending' :
                          'bg-danger/20 text-danger'
                        }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ContractTab({ contract, isLoading }: { contract?: LeaseContract; isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8 text-muted">Loading contract...</div>
  }

  if (!contract) {
    return <div className="text-center py-8 text-muted">No contract information available</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Contract Details</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted">Lease Type:</span>
              <span className="ml-2 font-medium">{contract.model}</span>
            </div>
            <div>
              <span className="text-sm text-muted">Terms:</span>
              <span className="ml-2">{contract.terms}</span>
            </div>
            <div>
              <span className="text-sm text-muted">Status:</span>
              <span className={`ml-2 pill ${contract.status === 'Active' ? 'approved' :
                contract.status === 'Expiring' ? 'pending' :
                  'bg-muted/30 text-muted'
                }`}>
                {contract.status}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted">Auto Renew:</span>
              <span className="ml-2">{contract.autoRenew ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Payment Schedule</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted">Rent:</span>
              <span className="ml-2 font-semibold">{contract.currency} {contract.rent.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-sm text-muted">Schedule:</span>
              <span className="ml-2">{contract.paymentSchedule}</span>
            </div>
            <div>
              <span className="text-sm text-muted">Start Date:</span>
              <span className="ml-2">{new Date(contract.startDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-sm text-muted">End Date:</span>
              <span className="ml-2">{new Date(contract.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {contract.violations && contract.violations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted mb-2">Violations</h3>
          <div className="p-3 bg-danger/10 rounded-lg">
            <ul className="list-disc list-inside space-y-1">
              {contract.violations.map((violation, idx) => (
                <li key={idx} className="text-sm">{violation}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentsTab({ tenantId }: { tenantId: string }) {
  // Mock documents since no API yet
  const docs = [
    { id: 'DOC-01', name: 'Lease Agreement 2024.pdf', size: '2.4 MB', date: '2024-01-15', category: 'Legal' },
    { id: 'DOC-02', name: 'Public Liability Insurance.pdf', size: '1.1 MB', date: '2024-03-20', category: 'Insurance' },
    { id: 'DOC-03', name: 'Site Maintenance Guidelines.pdf', size: '850 KB', date: '2024-05-10', category: 'Operational' },
  ]

  return (
    <div className="space-y-4 p-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Document Vault</h3>
        <button className="btn secondary text-xs">Upload Document</button>
      </div>
      <div className="grid gap-2">
        {docs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 text-accent rounded transition-colors group-hover:bg-accent group-hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <div className="text-sm font-medium">{doc.name}</div>
                <div className="text-xs text-muted">{doc.category} • {doc.date} • {doc.size}</div>
              </div>
            </div>
            <button className="p-2 hover:bg-accent/10 text-accent rounded-full transition-colors" title="Download">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function NoticesTab({ notices, isLoading }: { notices?: any[]; isLoading: boolean }) {
  if (isLoading) return <div className="text-center py-8 text-muted">Loading history...</div>

  return (
    <div className="space-y-4 p-2">
      <h3 className="text-lg font-semibold">Communication History</h3>
      {!notices || notices.length === 0 ? (
        <div className="text-center py-12 text-subtle border border-dashed border-border rounded-lg bg-muted/5">
          <svg className="w-12 h-12 mx-auto text-muted/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          No official notices have been sent to this tenant yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n: any) => (
            <div key={n.id} className="p-4 border border-border rounded-lg relative overflow-hidden bg-surface hover:border-accent/30 transition-colors">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${n.type === 'Warning' ? 'bg-amber-500' : n.type === 'Legal' ? 'bg-rose-500' : 'bg-blue-500'}`} />
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${n.type === 'Warning' ? 'bg-amber-100 text-amber-700' :
                    n.type === 'Legal' ? 'bg-rose-100 text-rose-700' :
                      'bg-blue-100 text-blue-700'
                  }`}>
                  {n.type}
                </span>
                <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="text-sm font-bold mb-1">{n.subject}</h4>
              <p className="text-xs text-muted line-clamp-2">{n.content}</p>
              <div className="mt-3 flex justify-end">
                <button className="text-[10px] text-accent font-black hover:underline tracking-wider">VIEW FULL NOTICE →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionsTab({ tenant, onSendNotice }: { tenant: Tenant; onSendNotice: () => void }) {
  const [suspendAck, setSuspendAck] = useState(false)

  return (
    <div className="space-y-8 p-2">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text">Available Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn pr-4" onClick={onSendNotice}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Send Official Notice
          </button>
          {tenant.status === 'Active' && (
            <button
              className="btn secondary"
              onClick={() => {
                if (confirm(`Are you sure you want to suspend ${tenant.name}? They will lose access to the portal temporarily.`)) {
                  setSuspendAck(true)
                  setTimeout(() => setSuspendAck(false), 3000)
                }
              }}
            >
              Suspend Tenant
            </button>
          )}
          {tenant.status === 'Suspended' && (
            <button className="btn secondary">
              Reactivate Tenant
            </button>
          )}
          <button
            className="btn secondary bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-200"
            onClick={() => confirm(`DANGER: Revoke tenure for ${tenant.name}? This action is irreversible and requires legal clearance.`)}
          >
            Revoke Tenure / Terminate
          </button>
        </div>
        {suspendAck && <div className="mt-3 text-xs text-rose-500 font-bold animate-pulse">Request sent to gateway. Syncing state...</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-muted/10 border border-border rounded-xl">
          <h4 className="text-xs uppercase font-black tracking-widest text-muted mb-4">Internal Management Notes</h4>
          <textarea
            className="w-full bg-transparent border-none text-sm focus:ring-0 resize-none placeholder:text-muted/40"
            placeholder="Add private management notes about this tenant..."
            rows={4}
          />
          <div className="mt-2 flex justify-end">
            <button className="text-[10px] font-bold text-accent hover:underline">SAVE NOTES</button>
          </div>
        </div>

        {tenant.outstandingDebt > 0 && (
          <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </div>
            <div className="font-bold text-amber-700 mb-2 text-sm flex items-center gap-2">
              Outstanding Debt Alert
            </div>
            <p className="text-xs text-amber-900/70 mb-4 font-medium leading-relaxed">
              This tenant has an arrears of ${tenant.outstandingDebt.toLocaleString()}. It is recommended to send a payment reminder.
            </p>
            <button className="btn bg-amber-600 text-white border-none hover:bg-amber-700 text-xs px-4 py-2" onClick={onSendNotice}>
              Send Reminder Notice
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
