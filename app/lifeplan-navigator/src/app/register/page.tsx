'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthPage from '@/components/auth/AuthPage';
import { useAuthStore } from '@/lib/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, router]);

  const handleSuccess = () => {
    router.push('/onboarding');
  };

  return <AuthPage initialMode="register" onSuccess={handleSuccess} />;
}
