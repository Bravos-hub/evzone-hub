import { create } from 'zustand'
import type { OwnerCapability, Role, UserProfile } from './types'
import { TOKEN_STORAGE_KEYS } from '@/core/api/config'
import { ROLE_GROUPS } from '@/constants/roles'
import { authService } from '@/core/api/services/authService'
import type { AuthResponse } from '@/core/api/types'

const LS_KEY = 'evzone:session'
const LS_IMP_KEY = 'evzone:impersonator'
const LS_IMP_RETURN_KEY = 'evzone:impersonation:returnTo'

type AuthState = {
  user: UserProfile | null
  impersonator: UserProfile | null
  impersonationReturnTo: string | null
  isLoading: boolean
  login: (opts: { email?: string; phone?: string; password: string }) => Promise<void>
  loginWithResponse: (response: AuthResponse) => void
  logout: () => Promise<void>
  startImpersonation: (target: { id: string; name: string; role: Role; ownerCapability?: OwnerCapability }, returnTo: string) => void
  stopImpersonation: () => void
  refreshUser: () => Promise<void>
}

function load(): UserProfile | null {
  try {
    // Try to load from API client's stored user first
    const apiUserRaw = localStorage.getItem(TOKEN_STORAGE_KEYS.user)
    if (apiUserRaw) {
      const apiUser = JSON.parse(apiUserRaw) as { id: string; name: string; email?: string; role: string }
      const user: UserProfile = {
        id: apiUser.id,
        name: apiUser.name,
        role: apiUser.role as Role,
        avatarUrl: apiUser.email 
          ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(apiUser.email)}`
          : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
      }
      return user
    }
    
    // Fallback to old session storage for backward compatibility
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as UserProfile
    // Inject mock avatar for existing sessions to demonstrate the feature
    if (!user.avatarUrl) {
      user.avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ronald'
    }
    return user
  } catch {
    return null
  }
}

function loadImpersonator(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_IMP_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

function loadReturnTo(): string | null {
  try {
    return localStorage.getItem(LS_IMP_RETURN_KEY)
  } catch {
    return null
  }
}

function save(user: UserProfile | null) {
  if (!user) localStorage.removeItem(LS_KEY)
  else localStorage.setItem(LS_KEY, JSON.stringify(user))
}

function saveImpersonator(user: UserProfile | null) {
  if (!user) localStorage.removeItem(LS_IMP_KEY)
  else localStorage.setItem(LS_IMP_KEY, JSON.stringify(user))
}

function saveReturnTo(value: string | null) {
  if (!value) localStorage.removeItem(LS_IMP_RETURN_KEY)
  else localStorage.setItem(LS_IMP_RETURN_KEY, value)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: load(),
  impersonator: loadImpersonator(),
  impersonationReturnTo: loadReturnTo(),
  isLoading: false,
  login: async ({ email, phone, password }) => {
    set({ isLoading: true })
    try {
      const response = await authService.login({ email, phone, password })
      get().loginWithResponse(response)
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  loginWithResponse: (response: AuthResponse) => {
    const user: UserProfile = {
      id: response.user.id,
      name: response.user.name,
      role: response.user.role as Role,
      avatarUrl: response.user.email 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(response.user.email)}`
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
    }
    save(user)
    saveImpersonator(null)
    saveReturnTo(null)
    set({ user, impersonator: null, impersonationReturnTo: null, isLoading: false })
  },
  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      save(null)
      saveImpersonator(null)
      saveReturnTo(null)
      set({ user: null, impersonator: null, impersonationReturnTo: null, isLoading: false })
    }
  },
  refreshUser: async () => {
    // This will be implemented when we create the user service
    // For now, just reload from storage
    const user = load()
    set({ user })
  },
  startImpersonation: (target, returnTo) => {
    const current = load()
    if (!current) return
    // only allow admins to impersonate in this demo
    if (!ROLE_GROUPS.PLATFORM_ADMINS.includes(current.role)) return

    const next: UserProfile = {
      id: target.id,
      name: target.name,
      role: target.role,
      ownerCapability: target.ownerCapability,
    }

    saveImpersonator(current)
    saveReturnTo(returnTo)
    save(next)
    set({ impersonator: current, impersonationReturnTo: returnTo, user: next })
  },
  stopImpersonation: () => {
    const imp = loadImpersonator()
    if (!imp) return
    saveImpersonator(null)
    saveReturnTo(null)
    save(imp)
    set({ impersonator: null, impersonationReturnTo: null, user: imp })
  },
}))

// Listen for token expiration events from API client
if (typeof window !== 'undefined') {
  window.addEventListener('auth:token-expired', () => {
    const store = useAuthStore.getState()
    if (store.user) {
      store.logout()
    }
  })
}

