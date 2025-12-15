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
import LawsPanel from './LawsPanel';
import LawQuiz from './LawQuiz';
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
  Target,
} from 'lucide-react';

type TabType = 'dashboard' | 'simulation' | 'benefits' | 'quiz' | 'settings';

export default function Dashboard() {
  const { user, currentLifeStage, notifications, nextActions, isAuthenticated, logout } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingActions = nextActions.filter((a) => !a.completed).length;

  const currentStageInfo = lifeStages.find((s) => s.stage === currentLifeStage);

  // ユーザーに関連するお得情報をフィルタリング（ライフステージ + 都道府県）
  const relevantBenefits = mockBenefits
    .filter((b) => {
      // ライフステージでフィルタリング
      if (!b.targetLifeStages.includes(currentLifeStage)) {
        return false;
      }
      // 都道府県でフィルタリング（全国 OR 在住都道府県 OR 勤務先都道府県に該当）
      const targetPrefectures = b.targetPrefectures || [];
      if (targetPrefectures.length === 0 || targetPrefectures.includes('全国')) {
        return true;
      }
      // ユーザーの在住・勤務先都道府県をチェック
      const userResidence = user?.residencePrefecture || user?.prefecture || '';
      const userWork = user?.workPrefecture || '';
      return targetPrefectures.some(pref =>
        pref === userResidence || pref === userWork
      );
    })
    .slice(0, 4);

  // 潜在的な節約額を計算
  const potentialSavings = relevantBenefits.reduce((sum, b) => sum + (b.amount || 0), 0);

  const tabs = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'simulation', label: 'シミュレーション', icon: TrendingUp },
    { id: 'benefits', label: '補助金・制度', icon: Gift },
    { id: 'quiz', label: '理解度チェック', icon: Target },
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

            {/* Laws Panel */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">関連する法令・制度</h2>
              <LawsPanel maxItems={4} showSearch={false} />
            </div>

            {/* Quiz CTA Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-6 h-6" />
                    <h3 className="text-lg font-bold">制度理解度チェック</h3>
                  </div>
                  <p className="text-blue-100 mb-4">
                    あなたに関連する法律や制度についてのクイズです。<br />
                    知らないと損しているかもしれません。今すぐチェック！
                  </p>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    チェックを始める
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="hidden sm:block ml-6">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl">📝</span>
                  </div>
                </div>
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

        {activeTab === 'quiz' && (
          <div className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">制度理解度チェック</h2>
                <p className="text-gray-600 mt-1">
                  あなたに関連する法律や制度についてのクイズです。
                  理解度を確認して、お得な情報を見逃していないかチェックしましょう。
                </p>
              </div>
              <LawQuiz />
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
