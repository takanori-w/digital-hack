/**
 * Login Page
 *
 * Uses NextAuth.js for authentication.
 * Redirects authenticated users to dashboard.
 *
 * Security Compliance:
 * - SEC-001: Session-based authentication
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import AuthPage from '@/components/auth/AuthPage';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    // Redirect authenticated users to callback URL
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Already authenticated - will redirect via useEffect
  if (status === 'authenticated') {
    return null;
  }

  const handleSuccess = () => {
    router.push(callbackUrl);
  };

  return <AuthPage initialMode="login" onSuccess={handleSuccess} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
