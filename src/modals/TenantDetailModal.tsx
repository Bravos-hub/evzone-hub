import { useState } from 'react'
import { useTenant, useTenantContract } from '@/modules/applications/hooks/useApplications'
import { useSendNotice } from '@/modules/notifications/hooks/useNotices'
import { SendNoticeModal } from './SendNoticeModal'
import { FinancialStatusCard } from '@/ui/components/FinancialStatusCard'
import { getErrorMessage } from '@/core/api/errors'
import type { Tenant, LeaseContract } from '@/core/api/types'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

interface TenantDetailModalProps {
  tenantId: string
  onClose: () => void
}

type Tab = 'overview' | 'financial' | 'contract' | 'actions'

/**
 * TenantDetailModal
 * Modal version of tenant detail (alternative to separate page)
 * Reusable component for viewing tenant information
 */
export function TenantDetailModal({ tenantId, onClose }: TenantDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showNoticeModal, setShowNoticeModal] = useState(false)

  const { data: tenant, isLoading, error } = useTenant(tenantId)
  const { data: contract, isLoading: contractLoading } = useTenantContract(tenantId)
  const sendNoticeMutation = useSendNotice()

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-panel border border-border-light rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="py-8">
              <TextSkeleton lines={2} centered />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-panel border border-border-light rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="p-4 bg-danger/10 text-danger rounded-lg">
              {error ? getErrorMessage(error) : 'Tenant not found'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'financial', label: 'Financial Status' },
    { id: 'contract', label: 'Contract/Lease' },
    { id: 'actions', label: 'Actions' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-panel border border-border-light rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-border-light sticky top-0 bg-panel z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{tenant.name}</h2>
                <p className="text-muted">{tenant.type} • {tenant.siteName}</p>
              </div>
              <button
                onClick={onClose}
                className="text-muted hover:text-text transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border-light px-6">
            <div className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === tab.id
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
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab tenant={tenant} />}
            {activeTab === 'financial' && <FinancialTab tenant={tenant} />}
            {activeTab === 'contract' && <ContractTab contract={contract} isLoading={contractLoading} />}
            {activeTab === 'actions' && (
              <ActionsTab
                tenant={tenant}
                onSendNotice={() => setShowNoticeModal(true)}
              />
            )}
          </div>
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
    </>
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
                      <span className={`pill ${
                        payment.status === 'completed' ? 'approved' :
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
    return (
      <div className="py-8">
        <TextSkeleton lines={2} centered />
      </div>
    )
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
              <span className={`ml-2 pill ${
                contract.status === 'Active' ? 'approved' :
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

function ActionsTab({ tenant, onSendNotice }: { tenant: Tenant; onSendNotice: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Available Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn" onClick={onSendNotice}>
            Send Notice
          </button>
          {tenant.status === 'Active' && (
            <button className="btn secondary">
              Suspend Tenant
            </button>
          )}
          {tenant.status === 'Suspended' && (
            <button className="btn secondary">
              Reactivate Tenant
            </button>
          )}
          <button className="btn secondary bg-danger/10 text-danger hover:bg-danger/20">
            Terminate Contract
          </button>
        </div>
      </div>

      {tenant.outstandingDebt > 0 && (
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="font-semibold text-warning mb-2">Outstanding Debt Alert</div>
          <p className="text-sm text-muted mb-3">
            This tenant has an outstanding debt of ${tenant.outstandingDebt.toLocaleString()}.
            Consider sending a payment reminder notice.
          </p>
          <button className="btn" onClick={onSendNotice}>
            Send Payment Reminder
          </button>
        </div>
      )}
    </div>
  )
}
