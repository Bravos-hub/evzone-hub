import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from './paths'
import type { Role } from '@/core/auth/types'

export function RequireAuth({ children }: PropsWithChildren) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth/login" replace />

  // Block access to dashboard/protected routes if application is still pending review
  if (user.status === 'Pending') {
    return <Navigate to={PATHS.AUTH.AWAITING_APPROVAL} replace />
  }

  return <>{children}</>
}

export function RequireRole({ roles, children }: PropsWithChildren<{ roles: Role[] }>) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth/login" replace />
  if (user.role === 'SUPER_ADMIN') return <>{children}</>
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}

