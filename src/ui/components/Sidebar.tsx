import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAuthStore } from '@/core/auth/authStore'
import { getMenuItemsForRole, type MenuItem } from '@/constants/menuItems'
import { ROLE_LABELS } from '@/constants/roles'
import { PATHS } from '@/app/router/paths'

type SidebarProps = {
  /** Optional: Override menu items (for backward compatibility) */
  items?: MenuItem[]
  /** Mobile: Close trigger */
  onClose?: () => void
}

/** Icon component that renders Feather-style icons */
function Icon({ name, className }: { name?: string; className?: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }

  switch (name) {
    case 'home':
      return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
    case 'briefcase':
      return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
    case 'map':
      return <svg {...props}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
    case 'zap':
      return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    case 'activity':
      return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
    case 'alert-triangle':
      return <svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    case 'truck':
      return <svg {...props}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
    case 'dollar-sign':
      return <svg {...props}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
    case 'map-pin':
      return <svg {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
    case 'tool':
      return <svg {...props}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    case 'users':
      return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
    case 'user-check':
      return <svg {...props}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
    case 'check-circle':
      return <svg {...props}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    case 'credit-card':
      return <svg {...props}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
    case 'trending-up':
      return <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
    case 'alert-circle':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    case 'file-text':
      return <svg {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
    case 'bell':
      return <svg {...props}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
    case 'radio':
      return <svg {...props}><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" /></svg>
    case 'shield':
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case 'lock':
      return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
    case 'heart':
      return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
    case 'server':
      return <svg {...props}><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
    case 'layers':
      return <svg {...props}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
    case 'toggle-left':
      return <svg {...props}><rect x="1" y="5" width="22" height="14" rx="7" ry="7" /><circle cx="8" cy="12" r="3" /></svg>
    case 'link':
      return <svg {...props}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
    case 'share-2':
      return <svg {...props}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
    case 'monitor':
      return <svg {...props}><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
    default:
      return null
  }
}

export function Sidebar({ items: overrideItems, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const nav = useNavigate()

  // Use override items if provided, otherwise filter by role
  const menuItems = overrideItems ?? getMenuItemsForRole(user?.role)

  return (
    <aside className="w-[280px] h-full flex-shrink-0 border-r border-white/5 p-0 bg-bg-secondary flex flex-col overflow-hidden shadow-lg">
      {/* Logo & Mobile Close */}
      <div className="flex items-center justify-between px-6 py-6 flex-shrink-0">
        <img src="/assets/cpms.png" alt="EVzone CPMS" className="h-10 lg:h-12 w-auto object-contain" />
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-muted hover:text-white transition-colors"
          aria-label="Close sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-hide">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'py-3 px-4 text-[14px] font-semibold transition-all duration-200 flex items-center gap-3.5',
                isActive
                  ? 'text-white bg-accent shadow-[0_4px_12px_rgba(247,127,0,0.25)] rounded-xl'
                  : 'text-text-secondary hover:text-text hover:bg-white/5 dark:hover:bg-white/5 rounded-xl'
              )
            }
            end={item.path === '/dashboard'}
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} className={clsx("flex-shrink-0", isActive ? "text-white" : "text-muted")} />
                <span className="truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] rounded-full bg-accent text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-white/5 bg-bg-secondary">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-panel/50 border border-white/5 flex items-center justify-center text-accent font-bold">
            {user?.name?.[0].toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{user?.name ?? 'Guest'}</div>
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
              {user?.role ? ROLE_LABELS[user.role] : 'GUEST'}
            </div>
          </div>
        </div>
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-accent/40 text-accent font-bold text-sm hover:bg-accent hover:text-white transition-all duration-200"
          onClick={() => {
            logout()
            nav(PATHS.AUTH.LOGIN)
            onClose?.()
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
