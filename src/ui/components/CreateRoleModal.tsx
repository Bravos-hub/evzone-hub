import { useState } from 'react'
import { Card } from './Card'
import { useCustomRolesStore } from '@/core/auth/customRolesStore'
import { PermissionSelector } from './PermissionSelector'

interface CreateRoleModalProps {
    onClose: () => void
    onRoleCreated: (roleId: string) => void
}

export function CreateRoleModal({ onClose, onRoleCreated }: CreateRoleModalProps) {
    const [name, setName] = useState('')
    const [permissions, setPermissions] = useState<string[]>([])
    const { addRole } = useCustomRolesStore()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        const id = `custom_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`
        addRole({
            id,
            name,
            permissions
        })
        onRoleCreated(id)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-2xl p-6 shadow-2xl border-white/10 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text">Create Custom Role</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-text-secondary transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 overflow-hidden">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-text-secondary ml-1">Role Name</label>
                        <input
                            autoFocus
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Billing Clerk"
                            className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
                        <label className="text-[11px] font-black uppercase tracking-wider text-text-secondary ml-1">Permissions</label>
                        <PermissionSelector
                            selectedPermissions={permissions}
                            onChange={setPermissions}
                        />
                    </div>

                    <div className="flex items-center gap-3 mt-2 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl font-bold text-sm text-text-secondary hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name}
                            className="flex-[2] h-11 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover disabled:opacity-50 transition-all shadow-lg shadow-accent/20"
                        >
                            Create Role
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
