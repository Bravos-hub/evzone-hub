
import { apiClient as api } from '@/core/api/client'

export interface TechnicianJob {
    id: string
    title: string
    station: string
    location: string
    priority: 'Urgent' | 'High' | 'Normal' | 'Low'
    status: 'Available' | 'Accepted' | 'In Progress' | 'Completed' | 'Cancelled'
    pay: number
    posted: string
    description?: string
}

export interface TechnicianAssignment {
    id: string
    name: string
    location: string
    status: 'online' | 'offline' | 'warning'
    capability: 'Charge' | 'Swap' | 'Both'
    shift: string
    attendant: string
    metrics: { label: string; value: string; tone: 'ok' | 'warn' | 'danger' }[]
}

export const techniciansService = {
    getJobs: async (): Promise<TechnicianJob[]> => {
        const { data } = await api.get('/technicians/me/jobs')
        return data
    },

    getAssignment: async (): Promise<TechnicianAssignment | null> => {
        const { data } = await api.get('/technicians/me/assignment')
        return data
    },
}
