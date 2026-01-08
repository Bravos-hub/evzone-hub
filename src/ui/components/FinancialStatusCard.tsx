import type { Tenant } from '@/core/api/types'

interface FinancialStatusCardProps {
  tenant: Tenant
  className?: string
}

/**
 * FinancialStatusCard
 * Reusable component for displaying tenant financial status
 * Shows outstanding debt, overdue payments, and next payment due
 */
export function FinancialStatusCard({ tenant, className = '' }: FinancialStatusCardProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Financial Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="text-sm text-muted mb-1">Outstanding Debt</div>
          <div className={`text-2xl font-bold ${tenant.outstandingDebt > 0 ? 'text-danger' : 'text-ok'}`}>
            ${tenant.outstandingDebt.toLocaleString()}
          </div>
          {tenant.outstandingDebt > 0 && (
            <div className="text-xs text-danger mt-1">Action required</div>
          )}
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
    </div>
  )
}
