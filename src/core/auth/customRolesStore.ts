import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CustomRoleDef = {
    id: string
    name: string
    permissions: string[] // Format: 'feature.action' e.g., 'stations.access', 'billing.edit'
    description?: string
}

type CustomRolesState = {
    roles: CustomRoleDef[]
    addRole: (role: CustomRoleDef) => void
    updateRole: (id: string, role: Partial<CustomRoleDef>) => void
    removeRole: (id: string) => void
    getRole: (id: string) => CustomRoleDef | undefined
}

export const useCustomRolesStore = create<CustomRolesState>()(
    persist(
        (set, get) => ({
            roles: [],
            addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
            updateRole: (id, update) => set((state) => ({
                roles: state.roles.map((r) => r.id === id ? { ...r, ...update } : r)
            })),
            removeRole: (id) => set((state) => ({
                roles: state.roles.filter((r) => r.id !== id)
            })),
            getRole: (id) => get().roles.find((r) => r.id === id)
        }),
        {
            name: 'evzone-custom-roles',
        }
    )
)
