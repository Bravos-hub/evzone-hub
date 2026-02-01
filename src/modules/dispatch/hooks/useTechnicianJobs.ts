
import { useQuery } from '@tanstack/react-query'
import { techniciansService } from '@/modules/operators/services/techniciansService'

export function useTechnicianJobs() {
    return useQuery({
        queryKey: ['technician-jobs'],
        queryFn: () => techniciansService.getJobs(),
    })
}
