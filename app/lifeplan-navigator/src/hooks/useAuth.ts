/**
 * Authentication Hook
 *
 * Provides convenient access to authentication state and methods.
 * Wraps next-auth/react useSession with additional utilities.
 *
 * Usage:
 * const { user, isAuthenticated, isLoading, signOut, requireMfa } = useAuth();
 */

'use client';

import { useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Role } from '@/lib/auth/config';

export interface UseAuthReturn {
  /**
   * Current user from session
   */
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: Role;
    mfaEnabled: boolean;
    mfaVerified: boolean;
  } | null;

  /**
   * Whether user is authenticated
   */
  isAuthenticated: boolean;

  /**
   * Whether session is loading
   */
  isLoading: boolean;

  /**
   * Whether MFA is required but not verified
   */
  requireMfa: boolean;

  /**
   * User's role
   */
  role: Role | null;

  /**
   * Check if user has specific role
   */
  hasRole: (role: Role) => boolean;

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (...roles: Role[]) => boolean;

  /**
   * Sign in with credentials
   */
  login: (email: string, password: string, callbackUrl?: string) => Promise<{ success: boolean; error?: string }>;

  /**
   * Sign out
   */
  logout: (callbackUrl?: string) => Promise<void>;

  /**
   * Refresh session
   */
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  const user = isAuthenticated && session?.user
    ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name,
        role: session.user.role || Role.USER,
        mfaEnabled: session.user.mfaEnabled || false,
        mfaVerified: session.user.mfaVerified || false,
      }
    : null;

  const requireMfa = user?.mfaEnabled && !user?.mfaVerified;

  const role = user?.role ?? null;

  const hasRole = useCallback(
    (targetRole: Role): boolean => {
      if (!role) return false;
      return role === targetRole;
    },
    [role]
  );

  const hasAnyRole = useCallback(
    (...roles: Role[]): boolean => {
      if (!role) return false;
      return roles.includes(role);
    },
    [role]
  );

  const login = useCallback(
    async (
      email: string,
      password: string,
      callbackUrl?: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: callbackUrl || '/dashboard',
        });

        if (result?.error) {
          // Map error codes to user-friendly messages
          const errorMessages: Record<string, string> = {
            CredentialsSignin: 'メールアドレスまたはパスワードが正しくありません',
            AccountLocked: 'アカウントがロックされています。しばらくしてから再試行してください',
            EmailNotVerified: 'メールアドレスが確認されていません',
            Default: 'ログインに失敗しました',
          };

          return {
            success: false,
            error: errorMessages[result.error] || errorMessages.Default,
          };
        }

        if (result?.ok) {
          // Redirect on success
          router.push(result.url || callbackUrl || '/dashboard');
          return { success: true };
        }

        return { success: false, error: 'ログインに失敗しました' };
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: '予期せぬエラーが発生しました' };
      }
    },
    [router]
  );

  const logout = useCallback(
    async (callbackUrl?: string): Promise<void> => {
      await nextAuthSignOut({
        redirect: true,
        callbackUrl: callbackUrl || '/login',
      });
    },
    []
  );

  const refreshSession = useCallback(async (): Promise<void> => {
    await update();
  }, [update]);

  return {
    user,
    isAuthenticated,
    isLoading,
    requireMfa: requireMfa || false,
    role,
    hasRole,
    hasAnyRole,
    login,
    logout,
    refreshSession,
  };
}

export default useAuth;
