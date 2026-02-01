
import { useQuery } from '@tanstack/react-query'
import { techniciansService } from '@/modules/operators/services/techniciansService'

export function useTechnicianAssignment() {
    return useQuery({
        queryKey: ['technician-assignment'],
        queryFn: () => techniciansService.getAssignment(),
    })
}
