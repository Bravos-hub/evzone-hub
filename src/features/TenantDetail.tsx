import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useTenant, useTenantContract } from '@/core/api/hooks/useTenants'
import { useSendNotice } from '@/core/api/hooks/useNotices'
import { SendNoticeModal } from '@/modals/SendNoticeModal'
import { getErrorMessage } from '@/core/api/errors'
import type { Tenant, LeaseContract } from '@/core/api/types'

type Tab = 'overview' | 'financial' | 'contract' | 'actions'

export function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showNoticeModal, setShowNoticeModal] = useState(false)

  const { data: tenant, isLoading, error } = useTenant(id || '')
  const { data: contract, isLoading: contractLoading } = useTenantContract(id || '')
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
        <div className="card">
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
      {/* Financial Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="text-sm text-muted mb-1">Outstanding Debt</div>
          <div className={`text-2xl font-bold ${tenant.outstandingDebt > 0 ? 'text-danger' : 'text-ok'}`}>
            ${tenant.outstandingDebt.toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="text-sm text-muted mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-ok">
            ${tenant.totalPaid.toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="text-sm text-muted mb-1">Earnings</div>
          <div className="text-2xl font-bold text-accent">
            ${tenant.earnings.toLocaleString()}
          </div>
        </div>
        {tenant.nextPaymentDue && (
          <div className="p-4 bg-surface rounded-lg border border-border">
            <div className="text-sm text-muted mb-1">Next Payment Due</div>
            <div className="text-lg font-semibold">
              {new Date(tenant.nextPaymentDue.date).toLocaleDateString()}
            </div>
            <div className="text-sm text-muted">${tenant.nextPaymentDue.amount.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Overdue Payments */}
      {tenant.overduePayments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-danger">Overdue Payments</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {tenant.overduePayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-semibold">${payment.amount.toLocaleString()}</td>
                    <td>{new Date(payment.dueDate).toLocaleDateString()}</td>
                    <td>
                      <span className="pill bg-danger/20 text-danger">
                        {payment.daysOverdue} days
                      </span>
                    </td>
                    <td className="text-muted">{payment.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
