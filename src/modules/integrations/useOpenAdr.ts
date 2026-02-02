/**
 * OpenADR Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { openAdrService } from './openAdrService'

export function useOpenAdrEvents(filters?: { status?: string; program?: string; signal?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['openadr', 'events', filters],
    queryFn: () => openAdrService.getEvents(filters),
  })
}
