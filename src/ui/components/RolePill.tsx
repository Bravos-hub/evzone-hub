import clsx from 'clsx'
import type { Role } from '@/core/auth/types'
import { ROLE_LABELS } from '@/constants/roles'
import { useCustomRolesStore } from '@/core/auth/customRolesStore'

export function RolePill({ role }: { role: Role | string }) {
  const { getRole } = useCustomRolesStore()

  // Try to find standard role label
  let label = ROLE_LABELS[role as Role]

  // If not found, try custom roles
  if (!label) {
    const customRole = getRole(role)
    if (customRole) {
      label = customRole.name
    } else {
      // Fallback
      label = role
    }
  }

  // Determine color class (simplified logic)
  const isAdmin = role === 'SUPER_ADMIN' || role === 'EVZONE_ADMIN'
  const isOps = role === 'EVZONE_OPERATOR' || role === 'STATION_OPERATOR'
  const isOwner = role === 'OWNER' || role === 'SITE_OWNER'
  const isCustom = !ROLE_LABELS[role as Role]

  const colorClass =
    isAdmin
      ? 'bg-[rgba(16,185,129,.15)] border-[rgba(16,185,129,.3)] text-[#34d399]'
      : isOps
        ? 'bg-[rgba(59,130,246,.15)] border-[rgba(59,130,246,.3)] text-[#93c5fd]'
        : isOwner
          ? 'bg-[rgba(245,158,11,.15)] border-[rgba(245,158,11,.3)] text-[#fbbf24]'
          : isCustom
            ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' // Distinct color for custom roles
            : 'bg-[rgba(239,68,68,.15)] border-[rgba(239,68,68,.3)] text-[#fca5a5]' // Red for staff/others

  return (
    <span className={clsx('inline-flex items-center gap-1.5 py-[5px] px-3 rounded-md text-[11px] font-semibold border border-transparent uppercase tracking-[0.3px]', colorClass)}>
      {label}
    </span>
  )
}

