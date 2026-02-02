/**
 * Utility Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { utilityService } from './utilityService'

export function useUtilityDashboard() {
  return useQuery({
    queryKey: ['utility', 'dashboard'],
    queryFn: () => utilityService.getDashboard(),
  })
}
