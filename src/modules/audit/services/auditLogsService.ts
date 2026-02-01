import { apiClient as api } from '@/core/api/client';

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
        return await api.get('/audit-logs', { params: filters } as any);
    },

    async getByResource(resource: string, resourceId: string): Promise<AuditLog[]> {
        return await api.get(`/audit-logs/resource/${resource}/${resourceId}`);
    },

    async getByActor(actor: string, limit?: number): Promise<AuditLog[]> {
        return await api.get(`/audit-logs/actor/${actor}`, { params: { limit } } as any);
    },
};
