import type { ReactNode } from 'react'
import { Card } from './Card'
import clsx from 'clsx'

interface DashboardStatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: ReactNode
    trend?: {
        value: number
        label: string
        isPositive: boolean
    }
    className?: string
}

export function DashboardStatCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    className,
}: DashboardStatCardProps) {
    return (
        <Card className={clsx('p-5 flex flex-col gap-4', className)}>
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <p className="text-[13px] font-medium text-text-secondary uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl lg:text-3xl font-bold text-text">{value}</h3>
                    {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
                </div>
                {icon && (
                    <div className="p-3 rounded-xl bg-accent/10 text-accent">
                        {icon}
                    </div>
                )}
            </div>

            {trend && (
                <div className="flex items-center gap-2">
                    <div
                        className={clsx(
                            'flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold leading-none',
                            trend.isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        )}
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={clsx(!trend.isPositive && 'rotate-180')}
                        >
                            <polyline points="18 15 12 9 6 15" />
                        </svg>
                        {trend.value}%
                    </div>
                    <span className="text-xs text-text-secondary">{trend.label}</span>
                </div>
            )}
        </Card>
    )
}
