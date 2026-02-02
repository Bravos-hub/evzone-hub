
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/core/api/client'
import { Role } from '@/core/auth/types'

export interface CustomRole {
    id: string
    name: string
    baseRole: Role
    modules: string[]
    memberCount: number
}

export function useRoles() {
    return useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            return apiClient.get<CustomRole[]>('/roles')
        }
    })
}

export function useCreateRole() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (role: Omit<CustomRole, 'id' | 'memberCount'>) => {
            return apiClient.post<CustomRole>('/roles', role)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] })
        }
    })
}

export function useDeleteRole() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            return apiClient.delete(`/roles/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] })
        }
    })
}
