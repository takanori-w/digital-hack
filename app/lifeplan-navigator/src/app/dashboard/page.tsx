'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Gift,
  Scale,
  Settings,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shield,
  Calculator
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
      // Remove the query parameter from URL
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const menuItems = [
    {
      title: '給付金・補助金',
      description: 'あなたが受け取れる可能性のある給付金・補助金を確認',
      icon: Gift,
      href: '/benefits',
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      title: '法律・制度',
      description: 'ライフプランに関連する法律・制度情報',
      icon: Scale,
      href: '/dashboard/laws',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: '設定',
      description: 'プロフィールや通知設定の変更',
      icon: Settings,
      href: '/settings',
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
    },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: 'ライフプラン分析',
      description: '収支シミュレーションで将来を可視化',
    },
    {
      icon: Shield,
      title: '制度活用サポート',
      description: '最新の給付金・税制優遇情報を提供',
    },
    {
      icon: Calculator,
      title: '自動計算',
      description: '複雑な計算も自動で行います',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Modal */}
        {showWelcome && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ようこそ！
              </h2>
              <p className="text-gray-600 mb-6">
                プロフィールの登録が完了しました。<br />
                あなたに最適な給付金・補助金情報をお届けします。
              </p>
              <button
                onClick={() => setShowWelcome(false)}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                始める
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-2">LifePlan Navigator</p>
        </div>

        {/* Main Menu */}
        <div className="space-y-4 mb-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`p-3 rounded-xl ${item.bgColor}`}>
                <item.icon className={`w-6 h-6 ${item.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">主な機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action */}
        <div className="mt-8 text-center">
          <Link
            href="/benefits"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            <Gift className="w-5 h-5" />
            給付金・補助金を確認する
          </Link>
        </div>
      </div>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
