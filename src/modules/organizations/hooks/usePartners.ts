
import { useQuery } from '@tanstack/react-query'
import { partnersService } from '../services/partnersService'

export function usePartners() {
    return useQuery({
        queryKey: ['partners'],
        queryFn: () => partnersService.getAll(),
    })
}
