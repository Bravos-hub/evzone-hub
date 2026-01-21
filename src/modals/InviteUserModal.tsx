import { useState } from 'react'
import { ALL_ROLES, ROLE_LABELS, CAPABILITY_LABELS } from '@/constants/roles'
import type { OwnerCapability, Role } from '@/core/auth/types'
import { Card } from '@/ui/components/Card'
import { useInviteUser } from '@/modules/auth/hooks/useUsers'
import { getErrorMessage } from '@/core/api/errors'

type InviteUserModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('OWNER')
  const [ownerCapability, setOwnerCapability] = useState<OwnerCapability>('BOTH')
  const [error, setError] = useState('')
  const [ack, setAck] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const inviteUser = useInviteUser()

  if (!isOpen) return null

  const showCapability = role === 'OWNER' || role === 'STATION_OPERATOR'

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

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    inviteUser.mutate({
      email: email.trim(),
      role,
      ownerCapability: showCapability ? ownerCapability : undefined,
      password,
    }, {
      onSuccess: () => {
        setAck('Invitation sent successfully!')
        setTimeout(() => {
          setEmail('')
          setRole('OWNER')
          setOwnerCapability('BOTH')
          setPassword('')
          setConfirmPassword('')
          setAck('')
          onClose()
        }, 1500)
      },
      onError: (err) => {
        setError(getErrorMessage(err))
      }
    })
  }

  function handleCancel() {
    setEmail('')
    setRole('OWNER')
    setOwnerCapability('BOTH')
    setError('')
    setAck('')
    setPassword('')
    setConfirmPassword('')
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
            {showCapability && (
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Capability *
                </label>
                <select
                  value={ownerCapability}
                  onChange={(e) => setOwnerCapability(e.target.value as OwnerCapability)}
                  className="select w-full"
                >
                  {(['CHARGE', 'SWAP', 'BOTH'] as OwnerCapability[]).map((cap) => (
                    <option key={cap} value={cap}>
                      {CAPABILITY_LABELS[cap]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="input w-full"
              />
              <p className="text-xs text-text-secondary mt-1">Set an initial password the user can change later.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat the previous password"
                className="input w-full"
              />
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

