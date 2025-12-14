'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import BenefitSearch from '@/components/BenefitSearch';
import { useAuthStore } from '@/lib/auth-store';
import { useAppStore } from '@/lib/store';

export default function BenefitsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { onboardingCompleted } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, onboardingCompleted, router]);

  if (!isAuthenticated || !onboardingCompleted) {
    return null;
  }

  return <BenefitSearch />;
}
