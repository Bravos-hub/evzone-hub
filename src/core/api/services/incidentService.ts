import { API_CONFIG } from '../config'
import type { Incident, MaintenanceNote, IncidentStatus } from '../types'

const baseURL = API_CONFIG.baseURL

export const incidentService = {
  getAll: async () => {
    const response = await fetch(`${baseURL}/incidents`)
    if (!response.ok) throw new Error('Failed to fetch incidents')
    return response.json() as Promise<Incident[]>
  },

  getById: async (id: string) => {
    const response = await fetch(`${baseURL}/incidents/${id}`)
    if (!response.ok) throw new Error('Failed to fetch incident')
    return response.json() as Promise<Incident>
  },

  assign: async (incidentId: string, technicianId: string, technicianName: string) => {
    const response = await fetch(`${baseURL}/incidents/${incidentId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, technicianName }),
    })
    if (!response.ok) throw new Error('Failed to assign incident')
    return response.json() as Promise<Incident>
  },

  addNote: async (incidentId: string, data: { content: string; authorId: string; authorName: string }) => {
    const response = await fetch(`${baseURL}/incidents/${incidentId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to add note')
    return response.json() as Promise<MaintenanceNote>
  },

  updateStatus: async (incidentId: string, status: IncidentStatus) => {
    const response = await fetch(`${baseURL}/incidents/${incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) throw new Error('Failed to update status')
    return response.json() as Promise<Incident>
  },

  create: async (data: any) => {
    const response = await fetch(`${baseURL}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create incident')
    return response.json() as Promise<Incident>
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${baseURL}/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update incident')
    return response.json() as Promise<Incident>
  }
}
