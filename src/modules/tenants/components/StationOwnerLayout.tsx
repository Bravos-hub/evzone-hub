import type { PropsWithChildren, ReactNode } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import clsx from 'clsx'

export type StationOwnerTab = 'assets' | 'leases'

type StationOwnerLayoutProps = PropsWithChildren<{
  activeTab: StationOwnerTab
  onTabChange: (tab: StationOwnerTab) => void
  pageTitle?: string
  description?: string
  assetsCount?: number
  leasesCount?: number
  headerActions?: ReactNode
}>

export function StationOwnerLayout({
  activeTab,
  onTabChange,
  pageTitle = 'Station Owner Dashboard',
  description = 'Monitor operations, lease performance, and delegated operators across your sites.',
  assetsCount,
  leasesCount,
  headerActions,
  children,
}: StationOwnerLayoutProps) {
  return (
    <DashboardLayout pageTitle={pageTitle}>
      <div className="space-y-6 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="text-sm text-muted max-w-2xl">{description}</p>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>

        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => onTabChange('assets')}
            className={clsx(
              'pb-3 px-4 border-b-2 transition-colors text-sm font-medium',
              activeTab === 'assets'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            )}
          >
            My Assets
            {typeof assetsCount === 'number' && (
              <span className="ml-2 pill bg-accent/10 text-accent text-[10px]">{assetsCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('leases')}
            className={clsx(
              'pb-3 px-4 border-b-2 transition-colors text-sm font-medium',
              activeTab === 'leases'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            )}
          >
            My Leases
            {typeof leasesCount === 'number' && (
              <span className="ml-2 pill bg-muted/30 text-muted text-[10px]">{leasesCount}</span>
            )}
          </button>
        </div>

        {children}
      </div>
    </DashboardLayout>
  )
}
