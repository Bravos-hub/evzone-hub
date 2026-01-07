import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { InviteUserModal } from '@/modals/InviteUserModal'
import { ROLE_LABELS } from '@/constants/roles'
import { PATHS } from '@/app/router/paths'
import { useTheme } from '@/ui/theme'
import clsx from 'clsx'

export function Header({ title, onMenuClick }: { title?: string; onMenuClick?: () => void }) {
  const nav = useNavigate()
  const { user, impersonator, impersonationReturnTo, logout, stopImpersonation } = useAuthStore()
  const { mode, setMode, effectiveTheme } = useTheme()
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const createRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!createOpen) return
      const el = createRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setCreateOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [createOpen])

  const createItems = useMemo(() => {
    const fallback = '/stations'
    const addStation = '/add-charger'
    const addChargePoint = '/add-charger'
    const addSwapStation = '/add-charger'
    const requestTechnician =
      user?.role === 'SUPER_ADMIN' || user?.role === 'EVZONE_ADMIN'
        ? '/dispatches'
        : user?.role === 'EVZONE_OPERATOR'
          ? '/operator-jobs'
          : '/dispatches'
    const listParkingSite = user?.role === 'SITE_OWNER' ? '/sites' : fallback

    return [
      { label: 'Add Station', to: addStation, action: 'navigate' },
      { label: 'Add Charge Point', to: addChargePoint, action: 'navigate' },
      { label: 'Add Swap Station', to: addSwapStation, action: 'navigate' },
      { label: 'Invite User', to: '', action: 'modal' },
      { label: 'Request Technician', to: requestTechnician, action: 'navigate' },
      { label: 'List Parking Site', to: listParkingSite, action: 'navigate' },
    ]
  }, [user?.role])

  const profileInitial = user?.name?.[0]?.toUpperCase?.() ?? 'U'

  return (
    <header className="sticky top-0 z-[90] flex items-center justify-between gap-3 lg:gap-6 px-4 lg:px-8 border-b border-white/5 bg-bg-secondary min-h-[64px] lg:min-h-[72px] flex-nowrap shadow-soft">
      {/* Left side: Hamburger & Title (Mobile) / Search (Desktop) */}
      <div className="flex items-center gap-3 flex-nowrap min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <h1 className="text-lg font-bold text-text truncate lg:hidden">{title}</h1>

        <div className={clsx(
          "relative flex-1 max-w-[400px] transition-all duration-300",
          "hidden lg:block",
          searchOpen && "!block fixed inset-x-0 top-0 h-[64px] bg-bg-secondary z-[100] px-4 flex items-center"
        )}>
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted lg:left-3.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            className="w-full bg-panel/30 border border-border-light text-text rounded-xl py-2 lg:py-2.5 pl-11 pr-14 text-[14px] transition-all duration-200 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light placeholder:text-muted"
            placeholder="Search…"
          />
          {searchOpen && (
            <button
              onClick={() => setSearchOpen(false)}
              className="lg:hidden absolute right-4 p-2 text-muted"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="inline-flex items-center gap-1.5 lg:gap-3 flex-shrink-0">
        <button
          className="lg:hidden p-2 text-muted"
          onClick={() => setSearchOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {impersonator && (
          <div className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent/80">Impersonating</span>
            <span className="text-xs font-semibold text-white truncate max-w-[80px]">{user?.name}</span>
            <button
              className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
              type="button"
              onClick={() => {
                const back = impersonationReturnTo || PATHS.ADMIN.USERS
                stopImpersonation()
                nav(back)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="relative flex-shrink-0" ref={createRef}>
          <button
            className="bg-accent border border-accent text-white py-1.5 lg:py-2 px-3 lg:px-4 rounded-xl text-[12px] lg:text-[13px] font-bold transition-all duration-200 whitespace-nowrap hover:bg-accent-hover inline-flex items-center gap-1 lg:gap-2 shadow-sm"
            onClick={() => setCreateOpen((v) => !v)}
          >
            <span>Create</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={createOpen ? 'rotate-180 transition-transform' : 'transition-transform'}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {createOpen && (
            <div className="absolute right-0 mt-2 w-[220px] rounded-2xl border border-white/5 bg-bg-secondary shadow-xl p-2 z-[120]">
              {createItems.map((it) => (
                <button
                  key={it.label}
                  className="w-full text-left px-4 py-2 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 text-sm text-text-secondary hover:text-text font-medium"
                  onClick={() => {
                    setCreateOpen(false)
                    if (it.action === 'modal') setInviteModalOpen(true)
                    else nav(it.to)
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                  <span className="truncate">{it.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="text-muted h-9 w-9 lg:h-10 lg:w-10 rounded-xl inline-flex items-center justify-center hover:bg-white/5 hover:text-accent transition-all duration-200"
          onClick={() => setMode(mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark')}
        >
          {effectiveTheme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          )}
        </button>

        <button
          className="hidden sm:inline-flex text-muted h-10 w-10 rounded-xl items-center justify-center hover:bg-white/5 hover:text-accent transition-all duration-200"
          onClick={() => nav(PATHS.NOTIFICATIONS)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        </button>

        <div className="w-px h-6 bg-white/10 mx-0.5 lg:mx-1" />

        <button
          onClick={() => nav(PATHS.SETTING)}
          className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-accent text-white inline-flex items-center justify-center font-bold shadow-lg hover:bg-accent-hover transition-all duration-200 overflow-hidden flex-shrink-0 border-2 border-white/10"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs lg:text-sm">{profileInitial}</span>
          )}
        </button>

        <button
          className="hidden lg:inline-flex bg-panel border border-border text-text h-10 w-10 rounded-xl items-center justify-center transition-all duration-200 hover:bg-panel-2"
          onClick={() => {
            logout()
            nav(PATHS.AUTH.LOGIN)
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
        </button>
      </div>

      <InviteUserModal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} onInvite={() => { }} />
    </header>
  )
}
