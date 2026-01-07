import { create } from 'zustand'
import type { Scope } from '@/core/auth/types'

type ScopeState = {
  scope: Scope
  setScope: (patch: Partial<Scope>) => void
}

export const useScopeStore = create<ScopeState>((set) => ({
  scope: { region: 'ALL', orgId: 'ALL', stationId: 'ALL', siteId: 'ALL', dateRange: '7D' },
  setScope: (patch) => set((s) => ({ scope: { ...s.scope, ...patch } })),
}))

