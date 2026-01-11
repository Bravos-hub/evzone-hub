import { useState } from 'react'
import { Card } from './Card'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/core/auth/types'
import { useCustomRolesStore } from '@/core/auth/customRolesStore'
import { CreateRoleModal } from './CreateRoleModal'
import clsx from 'clsx'

interface InviteMemberModalProps {
    onClose: () => void
    onInvite: (data: { email: string; role: Role }) => Promise<void>
}

export function InviteMemberModal({ onClose, onInvite }: InviteMemberModalProps) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<string>('ATTENDANT') // Allow string for custom roles
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCreateRole, setShowCreateRole] = useState(false)

    // Get custom roles from store
    const { roles: customRoles } = useCustomRolesStore()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setIsSubmitting(true)
        setError(null)
        try {
            await onInvite({ email, role: role as Role })
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to send invitation')
        } finally {
            setIsSubmitting(false)
        }
    }

    const standardRoles: Role[] = ['MANAGER', 'STATION_ADMIN', 'ATTENDANT', 'CASHIER', 'TECHNICIAN_ORG']

    return (
        <>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <Card className="w-full max-w-md p-6 shadow-2xl border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text">Invite Team Member</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-text-secondary transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-text-secondary ml-1">Email Address</label>
                            <input
                                autoFocus
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-text-secondary ml-1">Assign Role</label>
                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                                {standardRoles.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={clsx(
                                            'flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                                            role === r
                                                ? 'bg-accent/10 border-accent text-accent'
                                                : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/20'
                                        )}
                                    >
                                        <span className="text-sm font-bold">{ROLE_LABELS[r]}</span>
                                        {role === r && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))}

                                {customRoles.length > 0 && (
                                    <>
                                        <div className="px-1 py-1 text-[10px] font-bold text-muted uppercase">Custom Roles</div>
                                        {customRoles.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setRole(r.id)}
                                                className={clsx(
                                                    'flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                                                    role === r.id
                                                        ? 'bg-brand-orange/10 border-brand-orange text-brand-orange'
                                                        : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/20'
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{r.name}</span>
                                                    <span className="text-[10px] opacity-70">{r.permissions.length} permissions</span>
                                                </div>
                                                {role === r.id && (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setShowCreateRole(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/20 text-muted hover:text-white hover:border-white/40 hover:bg-white/5 transition-all mt-2"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    <span className="text-sm font-medium">Create New Role</span>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center gap-3 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 h-11 rounded-xl font-bold text-sm text-text-secondary hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] h-11 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-50 transition-all shadow-lg shadow-accent/20"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Invitation'}
                            </button>
                        </div>
                    </form>
                </Card>
            </div>

            {showCreateRole && (
                <CreateRoleModal
                    onClose={() => setShowCreateRole(false)}
                    onRoleCreated={(roleId) => {
                        setRole(roleId)
                    }}
                />
            )}
        </>
    )
}
