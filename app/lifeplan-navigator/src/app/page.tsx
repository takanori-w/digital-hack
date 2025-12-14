'use client';

import { useAppStore } from '@/lib/store';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const { onboardingCompleted } = useAppStore();

  // オンボーディングが完了していない場合は、ランディングページを表示
  // ユーザーがアンケートを完了すると、ダッシュボードが表示される
  if (!onboardingCompleted) {
    return <LandingPage />;
  }

  return <Dashboard />;
}
