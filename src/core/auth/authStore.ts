import { create } from 'zustand';
import type { OwnerCapability, Role, UserProfile } from './types';
import type { AuthResponse, User } from '@/core/api/types';
import { ROLE_GROUPS } from '@/constants/roles';
import { authService } from '@/modules/auth/services/authService';
import { userService } from '@/modules/auth/services/userService';
import { teamService } from '@/modules/auth/services/teamService';

const LS_KEY = 'evzone:session';
const LS_IMP_KEY = 'evzone:impersonator';
const LS_IMP_RETURN_KEY = 'evzone:impersonation:returnTo';
const LS_STATION_ASSIGNMENT_KEY = 'evzone:station_assignment_id';

type AuthState = {
  user: UserProfile | null;
  impersonator: UserProfile | null;
  impersonationReturnTo: string | null;
  isLoading: boolean;
  login: (opts: { email?: string; phone?: string; password: string; inviteToken?: string }) => Promise<AuthResponse>;
  loginWithUser: (user: AuthResponse['user']) => void;
  loginWithResponse: (response: AuthResponse) => void;
  logout: () => Promise<void>;
  startImpersonation: (
    target: { id: string; name: string; role: Role; ownerCapability?: OwnerCapability },
    returnTo: string
  ) => void;
  stopImpersonation: () => void;
  switchStationContext: (assignmentId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

type UserLike = Pick<
  AuthResponse['user'],
  | 'id'
  | 'name'
  | 'role'
  | 'ownerCapability'
  | 'providerId'
  | 'orgId'
  | 'organizationId'
  | 'activeOrganizationId'
  | 'memberships'
  | 'stationContexts'
  | 'activeStationContext'
  | 'mustChangePassword'
  | 'region'
  | 'zoneId'
  | 'avatarUrl'
> | Pick<
  User,
  | 'id'
  | 'name'
  | 'role'
  | 'ownerCapability'
  | 'providerId'
  | 'orgId'
  | 'organizationId'
  | 'activeOrganizationId'
  | 'memberships'
  | 'stationContexts'
  | 'activeStationContext'
  | 'mustChangePassword'
  | 'region'
  | 'zoneId'
  | 'avatarUrl'
>;

function toUserProfile(user: UserLike): UserProfile {
  const activeOrganizationId =
    user.activeOrganizationId || user.organizationId || user.orgId;
  const stationContexts = user.stationContexts || [];
  const preferredAssignmentId = loadSelectedStationAssignmentId();
  const resolvedActiveContext =
    (preferredAssignmentId
      ? stationContexts.find((context) => context.assignmentId === preferredAssignmentId)
      : undefined) ||
    user.activeStationContext ||
    stationContexts.find((context) => context.isPrimary) ||
    stationContexts[0] ||
    null;

  saveSelectedStationAssignmentId(resolvedActiveContext?.assignmentId || null);
  const effectiveRole = (resolvedActiveContext?.role || user.role) as Role;

  return {
    id: user.id,
    name: user.name,
    role: effectiveRole,
    ownerCapability: user.ownerCapability,
    providerId: user.providerId,
    orgId: activeOrganizationId || user.orgId,
    organizationId: activeOrganizationId || user.organizationId,
    activeOrganizationId,
    memberships: user.memberships,
    stationContexts,
    activeStationContext: resolvedActiveContext,
    mustChangePassword: user.mustChangePassword,
    region: user.region,
    zoneId: user.zoneId,
    avatarUrl: user.avatarUrl,
  };
}

function load(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
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

function loadSelectedStationAssignmentId(): string | null {
  try {
    return localStorage.getItem(LS_STATION_ASSIGNMENT_KEY);
  } catch {
    return null;
  }
}

function saveSelectedStationAssignmentId(value: string | null) {
  try {
    if (!value) localStorage.removeItem(LS_STATION_ASSIGNMENT_KEY);
    else localStorage.setItem(LS_STATION_ASSIGNMENT_KEY, value);
  } catch {
    // no-op in non-browser execution contexts
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: load(),
  impersonator: loadImpersonator(),
  impersonationReturnTo: loadReturnTo(),
  isLoading: false,

  login: async ({ email, phone, password, inviteToken }) => {
    set({ isLoading: true });
    try {
      // API returns only user data, cookies are set automatically
      const response = await authService.login({ email, phone, password, inviteToken });
      get().loginWithResponse(response);
      return response;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithUser: (user) => {
    const userProfile = toUserProfile(user);
    save(userProfile);
    saveSelectedStationAssignmentId(userProfile.activeStationContext?.assignmentId || null);
    saveImpersonator(null);
    saveReturnTo(null);
    set({ user: userProfile, impersonator: null, impersonationReturnTo: null, isLoading: false });
  },

  loginWithResponse: (response) => {
    const activeOrganizationId =
      response.user.activeOrganizationId ||
      response.activeOrganizationId ||
      response.user.organizationId ||
      response.user.orgId;

    get().loginWithUser({
      ...response.user,
      activeOrganizationId,
      organizationId: activeOrganizationId || response.user.organizationId,
      orgId: activeOrganizationId || response.user.orgId,
      memberships: response.user.memberships || response.memberships,
      stationContexts: response.user.stationContexts || response.stationContexts,
      activeStationContext:
        response.user.activeStationContext ?? response.activeStationContext ?? null,
      mustChangePassword:
        response.user.mustChangePassword ?? response.mustChangePassword,
    });
    void get().refreshUser();
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
      saveSelectedStationAssignmentId(null);
      saveImpersonator(null);
      saveReturnTo(null);
      set({ user: null, impersonator: null, impersonationReturnTo: null, isLoading: false });
    }
  },

  refreshUser: async () => {
    if (get().impersonator) return;

    try {
      const me = await userService.getMe();
      const userProfile = toUserProfile(me);
      save(userProfile);
      set({ user: userProfile });
    } catch (error) {
      console.warn('Failed to refresh user profile from backend:', error);
    }
  },

  switchStationContext: async (assignmentId) => {
    if (!assignmentId) return;
    const current = get().user;
    if (!current) return;

    const contexts = await teamService.switchMyStationContext(assignmentId);
    const nextActiveContext = contexts.activeStationContext;
    const nextRole = (nextActiveContext?.role || current.role) as Role;
    const nextUser: UserProfile = {
      ...current,
      role: nextRole,
      stationContexts: contexts.stationContexts,
      activeStationContext: nextActiveContext,
    };

    saveSelectedStationAssignmentId(nextActiveContext?.assignmentId || null);
    save(nextUser);
    set({ user: nextUser });
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
