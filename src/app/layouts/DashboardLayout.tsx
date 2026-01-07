import { useState, type PropsWithChildren } from 'react'
import { Sidebar } from '@/ui/components/Sidebar'
import { Header } from '@/ui/components/Header'
import { useAuthStore } from '@/core/auth/authStore'
import clsx from 'clsx'

export function DashboardLayout({ children, pageTitle }: PropsWithChildren<{ pageTitle: string }>) {
  const { user } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const showHelpFab = user
    ? [
      'EVZONE_ADMIN',
      'SUPER_ADMIN',
      'EVZONE_OPERATOR',
      'SITE_OWNER',
      'OWNER',
      'MANAGER',
      'TECHNICIAN_ORG',
      'TECHNICIAN_PUBLIC',
      'STATION_ADMIN',
      'ATTENDANT',
    ].includes(user.role)
    : false

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[110] lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Positioned fixed/absolute on mobile */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-[120] lg:relative lg:z-auto transition-transform duration-300 ease-in-out transform",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-bg">
        <Header
          title={pageTitle}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-7 overflow-y-auto bg-bg">
          {children}
        </main>
      </div>
      {showHelpFab && (
        <a
          href="/help"
          className="fixed bottom-6 right-6 z-[120] inline-flex items-center gap-2 px-5 py-3 rounded-full shadow-lg bg-accent text-white hover:bg-accent-hover hover:-translate-y-[1px] transition-all duration-200 font-bold text-[13px] tracking-wide"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
          Help
        </a>
      )}
    </div>
  )
}

