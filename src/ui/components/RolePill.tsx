import clsx from 'clsx'
import type { Role } from '@/core/auth/types'

export function RolePill({ role }: { role: Role }) {
  const label =
    role === 'SUPER_ADMIN'
      ? 'Super Admin'
      : role === 'EVZONE_ADMIN'
      ? 'EVzone Admin'
      : role === 'EVZONE_OPERATOR'
        ? 'EVzone Operator'
        : role === 'SITE_OWNER'
          ? 'Site Owner'
          : role === 'OWNER'
            ? 'Station Owner'
            : role === 'STATION_ADMIN'
              ? 'Station Admin'
              : role === 'MANAGER'
                ? 'Manager'
                : role === 'ATTENDANT'
                  ? 'Attendant'
                  : role === 'TECHNICIAN_ORG'
                    ? 'Technician (Org)'
                    : 'Technician (Public)'

  const colorClass =
    role === 'SUPER_ADMIN' || role === 'EVZONE_ADMIN'
      ? 'bg-[rgba(16,185,129,.15)] border-[rgba(16,185,129,.3)] text-[#34d399]'
      : role === 'EVZONE_OPERATOR'
        ? 'bg-[rgba(59,130,246,.15)] border-[rgba(59,130,246,.3)] text-[#93c5fd]'
        : role === 'OWNER' || role === 'SITE_OWNER'
          ? 'bg-[rgba(245,158,11,.15)] border-[rgba(245,158,11,.3)] text-[#fbbf24]'
          : 'bg-[rgba(239,68,68,.15)] border-[rgba(239,68,68,.3)] text-[#fca5a5]'

  return (
    <span className={clsx('inline-flex items-center gap-1.5 py-[5px] px-3 rounded-md text-[11px] font-semibold border border-transparent uppercase tracking-[0.3px]', colorClass)}>
      {label}
    </span>
  )
}

