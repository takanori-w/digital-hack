/**
 * Protected Route Component
 *
 * Client-side route protection wrapper.
 * Shows loading state while checking authentication.
 * Redirects to login if not authenticated.
 *
 * Note: Server-side protection is handled by middleware.ts
 * This component provides additional client-side UX.
 *
 * Security Compliance:
 * - SEC-001: Defense in depth (middleware + client-side)
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Require MFA verification for this route
   */
  requireMfa?: boolean;
  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;
  /**
   * Redirect URL for unauthenticated users
   */
  redirectTo?: string;
}

/**
 * Default loading spinner component
 */
function DefaultLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}

/**
 * MFA required component
 */
function MfaRequired() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          二要素認証が必要です
        </h2>
        <p className="text-gray-600 mb-6">
          このページにアクセスするには、二要素認証（MFA）を完了してください。
        </p>
        <button
          onClick={() => router.push('/auth/mfa-verify')}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          認証を完了する
        </button>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  children,
  requireMfa = false,
  loadingComponent,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.replace(`${redirectTo}?callbackUrl=${callbackUrl}`);
    }
  }, [status, router, redirectTo]);

  // Loading state
  if (status === 'loading') {
    return <>{loadingComponent || <DefaultLoading />}</>;
  }

  // Unauthenticated - will redirect via useEffect
  if (status === 'unauthenticated') {
    return <>{loadingComponent || <DefaultLoading />}</>;
  }

  // Check MFA requirement
  if (requireMfa && session?.user) {
    const { mfaEnabled, mfaVerified } = session.user;

    // If MFA is enabled but not verified in this session
    if (mfaEnabled && !mfaVerified) {
      return <MfaRequired />;
    }

    // If MFA is required but not set up
    if (!mfaEnabled) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              二要素認証のセットアップが必要です
            </h2>
            <p className="text-gray-600 mb-6">
              このページにアクセスするには、二要素認証（MFA）を設定してください。
            </p>
            <button
              onClick={() => router.push('/settings/security/mfa-setup')}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              MFAをセットアップ
            </button>
          </div>
        </div>
      );
    }
  }

  // Authenticated (and MFA verified if required)
  return <>{children}</>;
}

export default ProtectedRoute;
