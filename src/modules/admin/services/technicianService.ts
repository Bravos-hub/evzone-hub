import { apiClient } from '@/core/api/client';

export type TechnicianStatus = 'active' | 'break' | 'offline' | 'busy';

export type TechnicianAvailability = {
    id: string;
    userId: string;
    status: TechnicianStatus;
    location?: string;
    lastPulse: string;
    user: {
        id: string;
        name: string;
        phone: string | null;
    };
};

export const technicianService = {
    getAll: async () => {
        return await apiClient.get<TechnicianAvailability[]>('/technicians/availability');
    },

    updateStatus: async (status: TechnicianStatus, location?: string) => {
        return await apiClient.post<TechnicianAvailability>('/technicians/status', { status, location });
    },
};
