import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { RolePill } from '@/ui/components/RolePill'
import { useAuthStore } from '@/core/auth/authStore'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/core/auth/types'
import { useRoles, useCreateRole, useDeleteRole, type CustomRole } from '../hooks/useRoles'

export function OperatorRoleManagement() {
    const { data: roles = [], isLoading } = useRoles()
    const { mutateAsync: createRole } = useCreateRole()
    const { mutateAsync: deleteRole } = useDeleteRole()
    const [isAdding, setIsAdding] = useState(false)
    const [newRole, setNewRole] = useState({ name: '', baseRole: 'ATTENDANT' as Role })

    const handleAddRole = async () => {
        if (!newRole.name) return
        try {
            await createRole({ ...newRole, modules: ['Dashboard'] })
            setIsAdding(false)
            setNewRole({ name: '', baseRole: 'ATTENDANT' })
        } catch (error) {
            console.error('Failed to create role:', error)
        }
    }

    const handleDeleteRole = async (id: string) => {
        if (confirm('Are you sure you want to delete this custom role?')) {
            try {
                await deleteRole(id)
            } catch (error) {
                console.error('Failed to delete role:', error)
            }
        }
    }

    return (
        <DashboardLayout pageTitle="Custom Role Management">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-display">Custom Roles</h1>
                    <p className="text-muted text-sm">Define specialized access for your local team members.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn primary flex items-center gap-2"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create New Role
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="card hover:border-accent transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold">{role.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted">Base:</span>
                                    <RolePill role={role.baseRole} />
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Access Modules</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {role.modules.map(mod => (
                                        <span key={mod} className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded">
                                            {mod}
                                        </span>
                                    ))}
                                    <button className="px-2 py-0.5 bg-white/5 border border-dashed border-white/20 text-[10px] font-bold rounded hover:border-accent hover:text-accent">
                                        + Edit
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border flex justify-between items-center mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[...Array(Math.min(role.memberCount, 3))].map((_, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border border-panel bg-white/10 flex items-center justify-center text-[8px] font-bold">
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                        ))}
                                        {role.memberCount > 3 && (
                                            <div className="w-6 h-6 rounded-full border border-panel bg-white/5 flex items-center justify-center text-[8px] font-bold">
                                                +{role.memberCount - 3}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted">{role.memberCount} members</span>
                                </div>
                                <button className="text-xs font-bold text-accent hover:underline">Manage Assignments</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Create Custom Role</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Role Name</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="e.g. Night Supervisor"
                                    value={newRole.name}
                                    onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="label">Base Permissions Role</label>
                                <select
                                    className="select w-full"
                                    value={newRole.baseRole}
                                    onChange={e => setNewRole({ ...newRole, baseRole: e.target.value as Role })}
                                >
                                    <option value="MANAGER">Manager</option>
                                    <option value="ATTENDANT">Attendant</option>
                                    <option value="CASHIER">Cashier</option>
                                    <option value="TECHNICIAN_ORG">Technician</option>
                                </select>
                                <p className="text-[10px] text-muted mt-1">Starting point for permissions logic.</p>
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button className="btn secondary" onClick={() => setIsAdding(false)}>Cancel</button>
                                <button className="btn primary" onClick={handleAddRole}>Create Role</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
