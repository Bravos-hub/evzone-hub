import { create } from 'zustand';
import type { OwnerCapability, Role, UserProfile } from './types';
import { ROLE_GROUPS } from '@/constants/roles';
import { authService } from '@/modules/auth/services/authService';

const LS_KEY = 'evzone:session';
const LS_IMP_KEY = 'evzone:impersonator';
const LS_IMP_RETURN_KEY = 'evzone:impersonation:returnTo';

type AuthState = {
  user: UserProfile | null;
  impersonator: UserProfile | null;
  impersonationReturnTo: string | null;
  isLoading: boolean;
  login: (opts: { email?: string; phone?: string; password: string }) => Promise<void>;
  loginWithUser: (user: UserProfile) => void;
  logout: () => Promise<void>;
  startImpersonation: (
    target: { id: string; name: string; role: Role; ownerCapability?: OwnerCapability },
    returnTo: string
  ) => void;
  stopImpersonation: () => void;
  refreshUser: () => Promise<void>;
};

function load(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as UserProfile;
    // Inject mock avatar if missing
    if (!user.avatarUrl) {
      user.avatarUrl = user.role
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.role}`
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
    }
    return user;
  } catch {
    return null;
  }
}

function loadImpersonator(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_IMP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function loadReturnTo(): string | null {
  try {
    return localStorage.getItem(LS_IMP_RETURN_KEY);
  } catch {
    return null;
  }
}

function save(user: UserProfile | null) {
  if (!user) localStorage.removeItem(LS_KEY);
  else localStorage.setItem(LS_KEY, JSON.stringify(user));
}

function saveImpersonator(user: UserProfile | null) {
  if (!user) localStorage.removeItem(LS_IMP_KEY);
  else localStorage.setItem(LS_IMP_KEY, JSON.stringify(user));
}

function saveReturnTo(value: string | null) {
  if (!value) localStorage.removeItem(LS_IMP_RETURN_KEY);
  else localStorage.setItem(LS_IMP_RETURN_KEY, value);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: load(),
  impersonator: loadImpersonator(),
  impersonationReturnTo: loadReturnTo(),
  isLoading: false,

  login: async ({ email, phone, password }) => {
    set({ isLoading: true });
    try {
      // API returns only user data, cookies are set automatically
      const response = await authService.login({ email, phone, password });
      get().loginWithUser(response.user);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithUser: (user) => {
    const userProfile: UserProfile = {
      id: user.id,
      name: user.name,
      role: user.role as Role,
      ownerCapability: user.ownerCapability,
      avatarUrl: user.email
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
    };
    save(userProfile);
    saveImpersonator(null);
    saveReturnTo(null);
    set({ user: userProfile, impersonator: null, impersonationReturnTo: null, isLoading: false });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // This will clear cookies and revoke refresh token
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      save(null);
      saveImpersonator(null);
      saveReturnTo(null);
      set({ user: null, impersonator: null, impersonationReturnTo: null, isLoading: false });
    }
  },

  refreshUser: async () => {
    // Reload from storage
    const user = load();
    set({ user });
  },

  startImpersonation: (target, returnTo) => {
    const current = load();
    if (!current) return;
    // Only allow admins to impersonate
    if (!ROLE_GROUPS.PLATFORM_ADMINS.includes(current.role)) return;

    const next: UserProfile = {
      id: target.id,
      name: target.name,
      role: target.role,
      ownerCapability: target.ownerCapability,
    };

    saveImpersonator(current);
    saveReturnTo(returnTo);
    save(next);
    set({ impersonator: current, impersonationReturnTo: returnTo, user: next });
  },

  stopImpersonation: () => {
    const imp = loadImpersonator();
    if (!imp) return;
    saveImpersonator(null);
    saveReturnTo(null);
    save(imp);
    set({ impersonator: null, impersonationReturnTo: null, user: imp });
  },
}));

// Listen for token expiration events
if (typeof window !== 'undefined') {
  window.addEventListener('auth:token-expired', () => {
    const store = useAuthStore.getState();
    if (store.user) {
      store.logout();
    }
  });
}
