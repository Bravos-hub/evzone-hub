import clsx from 'clsx'

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'SendBack'

export function StatusPill({ status }: { status: ApprovalStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 py-[5px] px-3 rounded-md text-[11px] font-semibold border border-transparent uppercase tracking-[0.3px]',
        status === 'Pending'
          ? 'bg-[rgba(245,158,11,.15)] border-[rgba(245,158,11,.3)] text-[#fbbf24]'
          : status === 'Approved'
            ? 'bg-[rgba(16,185,129,.15)] border-[rgba(16,185,129,.3)] text-[#34d399]'
            : status === 'Rejected'
              ? 'bg-[rgba(239,68,68,.15)] border-[rgba(239,68,68,.3)] text-[#fca5a5]'
              : 'bg-[rgba(59,130,246,.15)] border-[rgba(59,130,246,.3)] text-[#93c5fd]'
      )}
    >
      {status}
    </span>
  )
}

