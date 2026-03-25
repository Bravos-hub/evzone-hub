import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from './paths'
import type { Role, UserProfile } from '@/core/auth/types'
import { hasPermission, type PermissionFeature } from '@/constants/permissions'

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

export function RequirePermission({
  feature,
  permission = 'access',
  when,
  children,
}: PropsWithChildren<{
  feature: PermissionFeature
  permission?: string
  when?: (user: UserProfile) => boolean
}>) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to={PATHS.AUTH.LOGIN} replace />
  if (user.role !== 'SUPER_ADMIN' && !hasPermission(user.role, feature, permission)) {
    return <Navigate to={PATHS.ERRORS.UNAUTHORIZED} replace />
  }
  if (when && !when(user)) {
    return <Navigate to={PATHS.ERRORS.UNAUTHORIZED} replace />
  }
  return <>{children}</>
}

