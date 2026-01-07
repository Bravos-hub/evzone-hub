import { useState } from 'react'
import { ALL_ROLES, ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/core/auth/types'
import { Card } from '@/ui/components/Card'

type InviteUserModalProps = {
  isOpen: boolean
  onClose: () => void
  onInvite: (email: string, role: Role) => void
}

export function InviteUserModal({ isOpen, onClose, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('OWNER')
  const [error, setError] = useState('')
  const [ack, setAck] = useState('')

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setAck('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    onInvite(email.trim(), role)
    setAck('Invitation sent successfully!')
    setTimeout(() => {
      setEmail('')
      setRole('OWNER')
      setAck('')
      onClose()
    }, 1500)
  }

  function handleCancel() {
    setEmail('')
    setRole('OWNER')
    setError('')
    setAck('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCancel}>
      <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Card className="w-full max-w-md p-6 m-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text">Invite User</h2>
            <button onClick={handleCancel} className="text-muted hover:text-text">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="input w-full"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="select w-full"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {(error || ack) && (
              <div className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
                {error || ack}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4">
              <button type="button" onClick={handleCancel} className="btn secondary">
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Send Invitation
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

