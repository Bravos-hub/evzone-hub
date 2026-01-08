import type { PaymentMethod } from '@/core/api/types'

interface PaymentMethodCardProps {
  method: PaymentMethod
  onEdit?: () => void
  onDelete?: () => void
  onSetDefault?: () => void
  showActions?: boolean
  className?: string
}

/**
 * PaymentMethodCard
 * Display payment method with edit/delete options
 * Shows method type icon and masked details
 */
export function PaymentMethodCard({
  method,
  onEdit,
  onDelete,
  onSetDefault,
  showActions = true,
  className = '',
}: PaymentMethodCardProps) {
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return '🏦'
      case 'mobile':
        return '📱'
      case 'wallet':
        return '💳'
      case 'card':
        return '💳'
      default:
        return '💰'
    }
  }

  const getMethodDetails = () => {
    if (method.type === 'bank') {
      return `${method.bankName} • ${method.accountNumber}`
    }
    if (method.type === 'mobile') {
      return `${method.provider || 'Mobile'} • ${method.phoneNumber}`
    }
    if (method.type === 'wallet') {
      return `${method.walletType || 'Wallet'} • ${method.walletAddress?.slice(0, 10)}...`
    }
    if (method.type === 'card') {
      return `${method.cardBrand} • ****${method.cardLast4} • ${method.cardExpiry}`
    }
    return 'N/A'
  }

  return (
    <div className={`p-4 border border-border-light rounded-lg hover:border-accent transition-colors ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getMethodIcon(method.type)}</span>
          <div>
            <div className="font-semibold">{method.label}</div>
            <div className="text-sm text-muted capitalize">{method.type}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {method.isDefault && (
            <span className="pill approved text-xs">Default</span>
          )}
          {!method.isVerified && (
            <span className="pill bg-warning/20 text-warning text-xs">Unverified</span>
          )}
        </div>
      </div>
      <div className="text-sm text-muted mb-3">
        {getMethodDetails()}
      </div>
      {showActions && (
        <div className="flex gap-2">
          {!method.isDefault && onSetDefault && (
            <button
              onClick={onSetDefault}
              className="btn secondary text-xs"
            >
              Set Default
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="btn secondary text-xs"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="btn secondary text-xs text-danger hover:bg-danger/10"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
