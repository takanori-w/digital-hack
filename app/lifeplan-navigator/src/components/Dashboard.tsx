'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { mockBenefits, mockStatistics, lifeStages } from '@/data/mockData';
import { formatCurrency } from '@/lib/simulation';
import BenefitCard from './BenefitCard';
import NextActionList from './NextActionList';
import SimulationChart from './SimulationChart';
import StatisticsComparison from './StatisticsComparison';
import NotificationPanel from './NotificationPanel';
import SettingsPanel from './SettingsPanel';
import { AnimalIcons } from './AnimalIcons';
import { AnimalType } from '@/types';
import {
  LayoutDashboard,
  TrendingUp,
  Gift,
  Settings,
  Bell,
  User,
  ChevronRight,
  Sparkles,
  LogIn,
  LogOut,
} from 'lucide-react';

type TabType = 'dashboard' | 'simulation' | 'benefits' | 'settings';

export default function Dashboard() {
  const { user, currentLifeStage, notifications, nextActions, isAuthenticated, logout } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingActions = nextActions.filter((a) => !a.completed).length;

  const currentStageInfo = lifeStages.find((s) => s.stage === currentLifeStage);

  // ユーザーに関連するお得情報をフィルタリング
  const relevantBenefits = mockBenefits
    .filter((b) => b.targetLifeStages.includes(currentLifeStage))
    .slice(0, 4);

  // 潜在的な節約額を計算
  const potentialSavings = relevantBenefits.reduce((sum, b) => sum + (b.amount || 0), 0);

  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'simulation', label: 'シミュレーション', icon: TrendingUp },
    { id: 'benefits', label: '補助金・制度', icon: Gift },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white text-xl font-bold">L</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">LifePlan Navigator</h1>
              <p className="text-xs text-gray-500">
                {currentStageInfo?.icon} {currentStageInfo?.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              {user?.favoriteAnimal ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-emerald-50 p-1 shadow-sm">
                  {(() => {
                    const Icon = AnimalIcons[user.favoriteAnimal as AnimalType];
                    return <Icon className="w-full h-full" />;
                  })()}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.name || 'ゲスト'}
              </span>
            </div>
            {/* ログイン/ログアウトボタン */}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  if (confirm('ログアウトしますか？')) {
                    logout();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">ログイン</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">潜在的な節約額</span>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(potentialSavings)}
                </div>
                <p className="text-xs text-gray-500 mt-1">あなたに適用可能な制度から算出</p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">やることリスト</span>
                  <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
                    {pendingActions}件
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{pendingActions}</div>
                <p className="text-xs text-gray-500 mt-1">未完了のアクション</p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">現在のライフステージ</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentStageInfo?.icon} {currentStageInfo?.label}
                </div>
                <p className="text-xs text-gray-500 mt-1">{currentStageInfo?.description}</p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Benefits */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    あなたにおすすめのお得情報
                  </h2>
                  <button
                    onClick={() => setActiveTab('benefits')}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    すべて見る
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {relevantBenefits.map((benefit) => (
                    <BenefitCard key={benefit.id} benefit={benefit} />
                  ))}
                </div>
              </div>

              {/* Right Column - Actions */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">ネクストアクション</h2>
                <NextActionList />
              </div>
            </div>

            {/* Statistics Comparison */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">同年収帯との比較</h2>
              <StatisticsComparison statistics={mockStatistics} />
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="animate-fade-in">
            <SimulationChart />
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">すべての補助金・制度</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockBenefits.map((benefit) => (
                <BenefitCard key={benefit.id} benefit={benefit} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <SettingsPanel />
          </div>
        )}
      </main>
    </div>
  );
}
