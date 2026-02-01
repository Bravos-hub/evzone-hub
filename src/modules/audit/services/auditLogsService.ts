import { API_CONFIG } from '@/core/api/config';

const baseURL = API_CONFIG.baseURL;

export type AuditLog = {
    id: string;
    timestamp: string;
    actor: string;
    actorName?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    status: string;
    errorMessage?: string;
};

export type AuditLogFilters = {
    actor?: string;
    action?: string;
    resource?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
};

export const auditLogsService = {
    async getAll(filters?: AuditLogFilters): Promise<{ data: AuditLog[]; pagination: any }> {
        const params = new URLSearchParams();
        if (filters?.actor) params.append('actor', filters.actor);
        if (filters?.action) params.append('action', filters.action);
        if (filters?.resource) params.append('resource', filters.resource);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.limit) params.append('limit', String(filters.limit));

        const url = `${baseURL}/audit-logs${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        return response.json();
    },

    async getByResource(resource: string, resourceId: string): Promise<AuditLog[]> {
        const response = await fetch(`${baseURL}/audit-logs/resource/${resource}/${resourceId}`);
        if (!response.ok) throw new Error('Failed to fetch audit logs for resource');
        return response.json();
    },

    async getByActor(actor: string, limit?: number): Promise<AuditLog[]> {
        const url = `${baseURL}/audit-logs/actor/${actor}${limit ? `?limit=${limit}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch audit logs for actor');
        return response.json();
    },
};
