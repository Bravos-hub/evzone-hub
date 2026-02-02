/* eslint-disable react-refresh/only-export-components */
/**
 * Data Provider
 * 
 * Currently using MSW for API mocking in demo mode.
 * This provider can be used in the future to inject repository implementations
 * when migrating to a clean architecture pattern.
 * 
 * For now, this is a placeholder that can be removed or expanded as needed.
 */

import { createContext, useContext, type ReactNode } from 'react'

interface DataContextValue {
  // Future: repositories, services, etc.
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  // Currently no-op since MSW handles mocking
  // Future: provide repository instances here
  return <DataContext.Provider value={{}}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}
