import { useEffect, useMemo, useState } from 'react'
import { useUsers } from '@/modules/auth/hooks/useUsers'
import type { Station, User } from '@/core/api/types'

type OperatorAssignmentModalProps = {
  open: boolean
  siteName: string
  initialOperatorId?: string
  onClose: () => void
  onAssign: (payload: { operatorId: string; contractType: Station['contractType']; revenueShare?: number }) => void
  isSubmitting?: boolean
}

export function OperatorAssignmentModal({
  open,
  siteName,
  initialOperatorId,
  onClose,
  onAssign,
  isSubmitting = false,
}: OperatorAssignmentModalProps) {
  const { data: users, isLoading } = useUsers()

  const operators = useMemo(() => {
    if (!users) return [] as User[]
    return users.filter(user => user.role === 'STATION_OPERATOR' || user.role === 'EVZONE_OPERATOR')
  }, [users])

  const [selectedOp, setSelectedOp] = useState(initialOperatorId || '')
  const [contractType, setContractType] = useState<Station['contractType']>('REVENUE_SHARE')
  const [revenueShare, setRevenueShare] = useState(15)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setSelectedOp(initialOperatorId || '')
      setContractType('REVENUE_SHARE')
      setRevenueShare(15)
      setError('')
    }
  }, [open, initialOperatorId])

  if (!open) return null

  const handleAssign = () => {
    if (!selectedOp) {
      setError('Please select an operator to assign.')
      return
    }
    onAssign({
      operatorId: selectedOp,
      contractType,
      revenueShare: contractType === 'FIXED' ? undefined : revenueShare,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-panel border border-border-light rounded-xl p-6 shadow-xl max-w-lg w-full mx-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text">Assign Operator</h3>
          <p className="text-sm text-muted mt-1">
            Delegate day-to-day operations for <span className="font-semibold">{siteName}</span>.
          </p>
        </div>

        {error && <div className="mb-3 text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="label">Operator</label>
            <select
              className="select w-full"
              value={selectedOp}
              onChange={(event) => setSelectedOp(event.target.value)}
              disabled={isLoading}
            >
              <option value="">{isLoading ? 'Loading operators...' : 'Select an operator'}</option>
              {operators.map(op => (
                <option key={op.id} value={op.id}>
                  {op.name} {op.email ? `(${op.email})` : ''}
                </option>
              ))}
            </select>
            {!isLoading && operators.length === 0 && (
              <p className="text-xs text-muted mt-2">No operators available yet.</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Contract Type</label>
              <select
                className="select w-full"
                value={contractType || ''}
                onChange={(event) => setContractType(event.target.value as Station['contractType'])}
              >
                <option value="REVENUE_SHARE">Revenue Share</option>
                <option value="FIXED">Fixed Fee</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            {contractType !== 'FIXED' && (
              <div>
                <label className="label">Revenue Share (%)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={revenueShare}
                  onChange={(event) => setRevenueShare(Number(event.target.value))}
                  min={0}
                  max={100}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" className="btn secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={handleAssign} disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}
