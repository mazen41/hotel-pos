'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi, ApiError } from '@/lib/api';
import type { User, AuthState, LoginCredentials, RegisterCredentials } from '@/types';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Token helpers ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'auth_token';

function persistToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  // Also set cookie for middleware
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  // Also clear cookie
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // On mount: verify stored token
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    authApi.me()
      .then(({ user }) => {
        // Extract role from roles array for easier access; permissions already top-level
        const userWithRole = {
          ...user,
          role: user.roles && user.roles.length > 0 ? user.roles[0].name : undefined,
        };
        setState({ user: userWithRole, token, isAuthenticated: true, isLoading: false });
      })
      .catch(() => {
        clearToken();
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { user, token } = await authApi.login(credentials);
    // Extract role from roles array for easier access; permissions already top-level
    const userWithRole = {
      ...user,
      role: user.roles && user.roles.length > 0 ? user.roles[0].name : undefined,
    };
    persistToken(token);
    setState({ user: userWithRole, token, isAuthenticated: true, isLoading: false });
    router.push('/pos');
  }, [router]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const { user, token } = await authApi.register(credentials);
    // Extract role from roles array for easier access; permissions already top-level
    const userWithRole = {
      ...user,
      role: user.roles && user.roles.length > 0 ? user.roles[0].name : undefined,
    };
    persistToken(token);
    setState({ user: userWithRole, token, isAuthenticated: true, isLoading: false });
    router.push('/pos');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best effort logout
    } finally {
      clearToken();
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      router.push('/login');
    }
  }, [router]);

  const hasPermission = useCallback((permission: string) => {
    return state.user?.permissions?.includes(permission) ?? false;
  }, [state.user?.permissions]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    const userPermissions = state.user?.permissions;
    if (!userPermissions) return false;
    return permissions.some(perm => userPermissions.includes(perm));
  }, [state.user?.permissions]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// ─── Permission Hook ─────────────────────────────────────────────────────────────

export function usePermissions() {
  const { hasPermission, hasAnyPermission, user } = useAuth();
  
  return {
    hasPermission,
    hasAnyPermission,
    user,
    can: hasPermission,
    canAny: hasAnyPermission,
  };
}
