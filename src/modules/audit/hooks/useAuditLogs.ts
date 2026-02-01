import { useQuery } from '@tanstack/react-query';
import { auditLogsService, type AuditLogFilters } from '../services/auditLogsService';

export function useAuditLogs(filters?: AuditLogFilters) {
    return useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: () => auditLogsService.getAll(filters),
    });
}

export function useAuditLogsByResource(resource: string, resourceId: string) {
    return useQuery({
        queryKey: ['audit-logs', 'resource', resource, resourceId],
        queryFn: () => auditLogsService.getByResource(resource, resourceId),
        enabled: !!resource && !!resourceId,
    });
}

export function useAuditLogsByActor(actor: string, limit?: number) {
    return useQuery({
        queryKey: ['audit-logs', 'actor', actor, limit],
        queryFn: () => auditLogsService.getByActor(actor, limit),
        enabled: !!actor,
    });
}
