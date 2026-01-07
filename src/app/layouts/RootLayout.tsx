/**
 * Root Layout
 * 
 * Base layout component for the application.
 * Currently not used in the routing structure, but available for future use
 * if a common layout wrapper is needed (e.g., header, footer, navigation).
 */

import { type ReactNode } from 'react'

export function RootLayout({ children }: { children: ReactNode }) {
  // Basic layout wrapper - can be expanded with header, footer, etc.
  return <div className="min-h-screen">{children}</div>
}
