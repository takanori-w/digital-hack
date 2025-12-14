'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Settings from '@/components/Settings';
import { useAuthStore } from '@/lib/auth-store';
import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const { onboardingCompleted, setOnboardingCompleted } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, onboardingCompleted, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    logout();
    router.push('/login');
  };

  const handleResetOnboarding = () => {
    setOnboardingCompleted(false);
    router.push('/onboarding');
  };

  if (!isAuthenticated || !onboardingCompleted) {
    return null;
  }

  return (
    <Settings
      onLogout={handleLogout}
      onResetOnboarding={handleResetOnboarding}
    />
  );
}
