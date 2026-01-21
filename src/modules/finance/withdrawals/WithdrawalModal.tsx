import { useState } from 'react'
import { useRequestWithdrawal, usePaymentMethods } from '@/core/api/hooks/useWithdrawals'
import { getErrorMessage } from '@/core/api/errors'
import type { PaymentMethod, PaymentMethodType } from '@/core/api/types'
import { PaymentMethodModal } from './PaymentMethodModal'

interface WithdrawalModalProps {
  balance: number
  currency: string
  onClose: () => void
  onSuccess: () => void
}

const WITHDRAWAL_MINIMUM = 10
const WITHDRAWAL_FEE_RATE = 0.02 // 2%

export function WithdrawalModal({ balance, currency, onClose, onSuccess }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedMethodId, setSelectedMethodId] = useState('')
  const [showAddMethod, setShowAddMethod] = useState(false)
  const [error, setError] = useState('')

  const { data: paymentMethods, isLoading: methodsLoading } = usePaymentMethods()
  const requestWithdrawalMutation = useRequestWithdrawal()

  const selectedMethod = paymentMethods?.find((m) => m.id === selectedMethodId)
  const amountNum = parseFloat(amount) || 0
  const fee = amountNum * WITHDRAWAL_FEE_RATE
  const netAmount = amountNum - fee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!amount || amountNum < WITHDRAWAL_MINIMUM) {
      setError(`Minimum withdrawal amount is ${currency} ${WITHDRAWAL_MINIMUM}`)
      return
    }

    if (amountNum > balance) {
      setError('Insufficient balance')
      return
    }

    if (!selectedMethodId) {
      setError('Please select a payment method')
      return
    }

    if (!selectedMethod) {
      setError('Selected payment method not found')
      return
    }

    if (!selectedMethod.isVerified) {
      setError('Selected payment method is not verified. Please verify it first.')
      return
    }

    try {
      await requestWithdrawalMutation.mutateAsync({
        amount: amountNum,
        method: selectedMethod.type,
        paymentMethodId: selectedMethodId,
        currency,
      })
      onSuccess()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-panel border border-border-light rounded-xl shadow-xl w-full max-w-lg">
          <div className="p-6 border-b border-border-light">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Request Withdrawal</h2>
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

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-danger/10 text-danger rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Available Balance */}
            <div className="p-4 bg-surface rounded-lg border border-border">
              <div className="text-sm text-muted mb-1">Available Balance</div>
              <div className="text-2xl font-bold">
                {currency} {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Withdrawal Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{currency}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min={WITHDRAWAL_MINIMUM}
                  max={balance}
                  step="0.01"
                  className="input w-full pl-10"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                Minimum: {currency} {WITHDRAWAL_MINIMUM}
              </p>
            </div>

            {/* Fee Calculation */}
            {amountNum > 0 && (
              <div className="p-4 bg-muted/20 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Amount:</span>
                  <span className="font-medium">{currency} {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fee ({WITHDRAWAL_FEE_RATE * 100}%):</span>
                  <span className="font-medium">{currency} {fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-semibold">
                  <span>You will receive:</span>
                  <span className="text-accent">{currency} {netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Payment Method</label>
                <button
                  type="button"
                  onClick={() => setShowAddMethod(true)}
                  className="text-sm text-accent hover:text-accent-hover"
                >
                  + Add New
                </button>
              </div>
              {methodsLoading ? (
                <div className="text-center py-4 text-muted">Loading payment methods...</div>
              ) : !paymentMethods || paymentMethods.length === 0 ? (
                <div className="p-4 bg-muted/20 rounded-lg text-center">
                  <p className="text-sm text-muted mb-2">No payment methods added</p>
                  <button
                    type="button"
                    onClick={() => setShowAddMethod(true)}
                    className="btn secondary text-sm"
                  >
                    Add Payment Method
                  </button>
                </div>
              ) : (
                <select
                  value={selectedMethodId}
                  onChange={(e) => setSelectedMethodId(e.target.value)}
                  className="select w-full"
                  required
                >
                  <option value="">Select a payment method</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.label}
                      {!method.isVerified && ' (Unverified)'}
                      {method.isDefault && ' (Default)'}
                    </option>
                  ))}
                </select>
              )}
              {selectedMethod && !selectedMethod.isVerified && (
                <p className="mt-2 text-sm text-danger">
                  This payment method needs to be verified before use
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-border-light">
              <button
                type="button"
                onClick={onClose}
                className="btn secondary"
                disabled={requestWithdrawalMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={
                  requestWithdrawalMutation.isPending ||
                  !amount ||
                  amountNum < WITHDRAWAL_MINIMUM ||
                  amountNum > balance ||
                  !selectedMethodId ||
                  !selectedMethod?.isVerified
                }
              >
                {requestWithdrawalMutation.isPending ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showAddMethod && (
        <PaymentMethodModal
          onClose={() => setShowAddMethod(false)}
          onSuccess={() => {
            setShowAddMethod(false)
            // Payment methods will be refetched automatically
          }}
        />
      )}
    </>
  )
}
