import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useWalletBalance, usePaymentMethods, useWithdrawalHistory, useDeletePaymentMethod, useSetDefaultPaymentMethod } from '@/core/api/hooks/useWithdrawals'
import { WithdrawalModal } from '@/modals/WithdrawalModal'
import { PaymentMethodModal } from '@/modals/PaymentMethodModal'
import { PaymentMethodCard } from '@/ui/components/PaymentMethodCard'
import { getErrorMessage } from '@/core/api/errors'
import type { PaymentMethod, WithdrawalTransaction } from '@/core/api/types'

export function SiteOwnerWithdrawals() {
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [showAddMethodModal, setShowAddMethodModal] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | undefined>()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: balance, isLoading: balanceLoading } = useWalletBalance()
  const { data: paymentMethods, isLoading: methodsLoading } = usePaymentMethods()
  const { data: withdrawalHistory, isLoading: historyLoading } = useWithdrawalHistory()
  const deleteMethodMutation = useDeletePaymentMethod()
  const setDefaultMutation = useSetDefaultPaymentMethod()

  const handleDeleteMethod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    try {
      await deleteMethodMutation.mutateAsync(id)
      setSuccess('Payment method deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(getErrorMessage(err))
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMutation.mutateAsync(id)
      setSuccess('Default payment method updated')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(getErrorMessage(err))
      setTimeout(() => setError(''), 5000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-ok/20 text-ok'
      case 'processing':
        return 'bg-pending/20 text-pending'
      case 'pending':
        return 'bg-pending/20 text-pending'
      case 'failed':
        return 'bg-danger/20 text-danger'
      default:
        return 'bg-muted/20 text-muted'
    }
  }


  return (
    <DashboardLayout pageTitle="Withdrawals">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-danger/10 text-danger rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-ok/10 text-ok rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Balance Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted mb-1">Available Balance</div>
              {balanceLoading ? (
                <div className="text-2xl font-bold text-muted">Loading...</div>
              ) : (
                <div className="text-3xl font-bold">
                  {balance?.currency || 'USD'} {balance?.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="btn"
              disabled={!balance || balance.balance < 10}
            >
              Withdraw Funds
            </button>
          </div>
          {balance && balance.balance < 10 && (
            <p className="mt-3 text-sm text-muted">
              Minimum withdrawal amount is {balance.currency} 10
            </p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="card">
          <div className="p-6 border-b border-border-light">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Payment Methods</h2>
              <button
                onClick={() => {
                  setEditingMethod(undefined)
                  setShowAddMethodModal(true)
                }}
                className="btn secondary"
              >
                + Add Payment Method
              </button>
            </div>
          </div>
          <div className="p-6">
            {methodsLoading ? (
              <div className="text-center py-8 text-muted">Loading payment methods...</div>
            ) : !paymentMethods || paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted mb-4">No payment methods added</p>
                <button
                  onClick={() => {
                    setEditingMethod(undefined)
                    setShowAddMethodModal(true)
                  }}
                  className="btn"
                >
                  Add Your First Payment Method
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onEdit={() => {
                      setEditingMethod(method)
                      setShowAddMethodModal(true)
                    }}
                    onDelete={() => handleDeleteMethod(method.id)}
                    onSetDefault={!method.isDefault ? () => handleSetDefault(method.id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="card">
          <div className="p-6 border-b border-border-light">
            <h2 className="text-lg font-semibold">Withdrawal History</h2>
          </div>
          <div className="p-6">
            {historyLoading ? (
              <div className="text-center py-8 text-muted">Loading history...</div>
            ) : !withdrawalHistory || withdrawalHistory.length === 0 ? (
              <div className="text-center py-8 text-muted">No withdrawal history</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Fee</th>
                      <th>Net Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalHistory.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                        <td className="font-semibold">
                          {transaction.currency} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-muted">
                          {transaction.currency} {transaction.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="font-semibold text-accent">
                          {transaction.currency} {transaction.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="capitalize">{transaction.method}</td>
                        <td>
                          <span className={`pill ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="text-sm text-muted font-mono">{transaction.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showWithdrawalModal && balance && (
        <WithdrawalModal
          balance={balance.balance}
          currency={balance.currency}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={() => {
            setShowWithdrawalModal(false)
            setSuccess('Withdrawal request submitted successfully')
            setTimeout(() => setSuccess(''), 3000)
          }}
        />
      )}

      {showAddMethodModal && (
        <PaymentMethodModal
          paymentMethod={editingMethod}
          onClose={() => {
            setShowAddMethodModal(false)
            setEditingMethod(undefined)
          }}
          onSuccess={() => {
            setShowAddMethodModal(false)
            setEditingMethod(undefined)
            setSuccess(editingMethod ? 'Payment method updated' : 'Payment method added')
            setTimeout(() => setSuccess(''), 3000)
          }}
        />
      )}
    </DashboardLayout>
  )
}
