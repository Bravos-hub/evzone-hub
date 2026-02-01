import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { technicianService, TechnicianStatus } from '../services/technicianService';

export function useTechnicianAvailability() {
    const queryClient = useQueryClient();

    const { data: technicians = [], isLoading, error } = useQuery({
        queryKey: ['technicians'],
        queryFn: technicianService.getAll,
        refetchInterval: 30000, // Refresh every 30s
    });

    const updateStatus = useMutation({
        mutationFn: (data: { status: TechnicianStatus; location?: string }) =>
            technicianService.updateStatus(data.status, data.location),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technicians'] });
        },
    });

    return {
        technicians,
        isLoading,
        error,
        updateStatus: updateStatus.mutate,
        isUpdating: updateStatus.isPending,
    };
}
