/**
 * Disputes Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { disputesService } from './disputesService'

export function useDisputes(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['disputes', filters],
    queryFn: () => disputesService.getAll(filters),
  })
}
