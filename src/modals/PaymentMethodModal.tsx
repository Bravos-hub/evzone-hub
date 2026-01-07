import { useState, useEffect } from 'react'
import { useAddPaymentMethod, useUpdatePaymentMethod } from '@/core/api/hooks/useWithdrawals'
import { getErrorMessage } from '@/core/api/errors'
import type { PaymentMethod, CreatePaymentMethodRequest, PaymentMethodType } from '@/core/api/types'

interface PaymentMethodModalProps {
  paymentMethod?: PaymentMethod
  onClose: () => void
  onSuccess: () => void
}

export function PaymentMethodModal({ paymentMethod, onClose, onSuccess }: PaymentMethodModalProps) {
  const isEditing = !!paymentMethod
  const [type, setType] = useState<PaymentMethodType>(paymentMethod?.type || 'bank')
  const [label, setLabel] = useState(paymentMethod?.label || '')
  const [error, setError] = useState('')

  // Mobile fields
  const [phoneNumber, setPhoneNumber] = useState(paymentMethod?.phoneNumber || '')
  const [provider, setProvider] = useState(paymentMethod?.provider || '')

  // Wallet fields
  const [walletType, setWalletType] = useState(paymentMethod?.walletType || '')
  const [walletAddress, setWalletAddress] = useState(paymentMethod?.walletAddress || '')

  // Card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState(paymentMethod?.cardExpiry || '')
  const [cardCvv, setCardCvv] = useState('')
  const [cardHolderName, setCardHolderName] = useState(paymentMethod?.cardHolderName || '')

  // Bank fields
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState(paymentMethod?.bankName || '')
  const [routingNumber, setRoutingNumber] = useState(paymentMethod?.routingNumber || '')
  const [accountHolderName, setAccountHolderName] = useState(paymentMethod?.accountHolderName || '')

  const addMutation = useAddPaymentMethod()
  const updateMutation = useUpdatePaymentMethod()

  useEffect(() => {
    if (!label && type) {
      const defaultLabels: Record<PaymentMethodType, string> = {
        mobile: 'Mobile Money',
        wallet: 'Digital Wallet',
        card: 'Credit/Debit Card',
        bank: 'Bank Account',
      }
      setLabel(defaultLabels[type])
    }
  }, [type, label])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!label.trim()) {
      setError('Label is required')
      return
    }

    const data: CreatePaymentMethodRequest = {
      type,
      label: label.trim(),
    }

    // Add type-specific fields
    if (type === 'mobile') {
      if (!phoneNumber.trim()) {
        setError('Phone number is required')
        return
      }
      data.phoneNumber = phoneNumber.trim()
      data.provider = provider.trim() || undefined
    } else if (type === 'wallet') {
      if (!walletAddress.trim()) {
        setError('Wallet address is required')
        return
      }
      data.walletType = walletType.trim() || undefined
      data.walletAddress = walletAddress.trim()
    } else if (type === 'card') {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim() || !cardHolderName.trim()) {
        setError('All card fields are required')
        return
      }
      data.cardNumber = cardNumber.trim()
      data.cardExpiry = cardExpiry.trim()
      data.cardCvv = cardCvv.trim()
      data.cardHolderName = cardHolderName.trim()
    } else if (type === 'bank') {
      if (!accountNumber.trim() || !bankName.trim() || !accountHolderName.trim()) {
        setError('Account number, bank name, and account holder name are required')
        return
      }
      data.accountNumber = accountNumber.trim()
      data.bankName = bankName.trim()
      data.routingNumber = routingNumber.trim() || undefined
      data.accountHolderName = accountHolderName.trim()
    }

    try {
      if (isEditing && paymentMethod) {
        await updateMutation.mutateAsync({ id: paymentMethod.id, data })
      } else {
        await addMutation.mutateAsync(data)
      }
      onSuccess()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-panel border border-border-light rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border-light">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Payment Method' : 'Add Payment Method'}
            </h2>
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

          {/* Type Selection */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PaymentMethodType)}
                className="select w-full"
              >
                <option value="bank">Bank Account</option>
                <option value="mobile">Mobile Money</option>
                <option value="wallet">Digital Wallet</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-sm font-medium mb-2">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Main Bank Account"
              className="input w-full"
              required
            />
          </div>

          {/* Mobile Money Fields */}
          {type === 'mobile' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+256700000000"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Provider (Optional)</label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g., MTN, Airtel"
                  className="input w-full"
                />
              </div>
            </>
          )}

          {/* Digital Wallet Fields */}
          {type === 'wallet' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Type (Optional)</label>
                <input
                  type="text"
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                  placeholder="e.g., PayPal, Skrill"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter wallet address"
                  className="input w-full"
                  required
                />
              </div>
            </>
          )}

          {/* Card Fields */}
          {type === 'card' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 19))}
                  placeholder="1234 5678 9012 3456"
                  className="input w-full"
                  maxLength={19}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setCardExpiry(value.length === 4 ? `${value.slice(0, 2)}/${value.slice(2)}` : value)
                    }}
                    placeholder="MM/YY"
                    className="input w-full"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CVV</label>
                  <input
                    type="text"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    className="input w-full"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Card Holder Name</label>
                <input
                  type="text"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="John Doe"
                  className="input w-full"
                  required
                />
              </div>
            </>
          )}

          {/* Bank Account Fields */}
          {type === 'bank' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Routing Number (Optional)</label>
                <input
                  type="text"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="Enter routing number"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Enter account holder name"
                  className="input w-full"
                  required
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border-light">
            <button
              type="button"
              onClick={onClose}
              className="btn secondary"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditing
                ? 'Update'
                : 'Add Payment Method'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
