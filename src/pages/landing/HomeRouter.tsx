import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'

export function HomeRouter() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth/login" replace />

  switch (user.role) {
    case 'SUPER_ADMIN': return <Navigate to="/dashboard" replace />
    case 'EVZONE_ADMIN': return <Navigate to="/admin" replace />
    case 'EVZONE_OPERATOR': return <Navigate to="/operator" replace />
    case 'SITE_OWNER': return <Navigate to="/site-owner" replace />
    case 'OWNER':
      return user.ownerCapability === 'SWAP'
        ? <Navigate to="/owner/swap" replace />
        : user.ownerCapability === 'BOTH'
          ? <Navigate to="/owner/both" replace />
          : <Navigate to="/owner/charge" replace />
    case 'STATION_ADMIN': return <Navigate to="/station-admin" replace />
    case 'MANAGER': return <Navigate to="/manager" replace />
    case 'ATTENDANT': return <Navigate to="/attendant" replace />
    case 'TECHNICIAN_ORG': return <Navigate to="/technician/org" replace />
    case 'TECHNICIAN_PUBLIC': return <Navigate to="/technician/public" replace />
    default: return <Navigate to="/auth/login" replace />
  }
}

