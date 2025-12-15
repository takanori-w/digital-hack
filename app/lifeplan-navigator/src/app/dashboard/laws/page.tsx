'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LawRecommendationCard } from '@/components/dashboard/LawRecommendationCard';
import { NextActionCard, type NextAction } from '@/components/dashboard/NextActionCard';
import { LawSearchWidget } from '@/components/dashboard/LawSearchWidget';
import type { LawRecommendation } from '@/hooks/useLawRecommendations';

// Mock next actions - in production, these would be generated based on user data
const mockNextActions: NextAction[] = [
  {
    id: '1',
    title: '年末調整の準備を始めましょう',
    description: '会社員の方は、年末調整の書類提出が必要です。扶養控除申告書などの準備をお忘れなく。',
    priority: 'high',
    dueDate: '2025-12-20',
    relatedLaw: '所得税法',
    steps: [
      '扶養控除申告書を確認',
      '保険料控除証明書を収集',
      '住宅ローン控除の書類準備',
    ],
  },
  {
    id: '2',
    title: '住宅購入の資金計画を立てましょう',
    description: '住宅購入を検討中の方は、住宅ローン控除などの制度を確認しておきましょう。',
    priority: 'medium',
    relatedLaw: '租税特別措置法',
    steps: [
      '住宅ローン控除の条件確認',
      '頭金の計画',
      '不動産取得税の確認',
    ],
  },
];

// Mock recommendations - static data to avoid infinite API loop issue
// Law IDs from e-Gov: https://elaws.e-gov.go.jp/document?lawid={lawId}
const mockRecommendations: LawRecommendation[] = [
  {
    law_id: '332AC0000000026',
    law_title: '租税特別措置法',
    law_num: '昭和三十二年法律第二十六号',
    relevance_reason: '住宅ローン控除に関する規定',
    relevance_score: 95,
    category: '税制',
    summary: '住宅ローンを利用して住宅を取得した場合に、所得税や住民税から控除を受けられます。',
  },
  {
    law_id: '340AC0000000033',
    law_title: '所得税法',
    law_num: '昭和四十年法律第三十三号',
    relevance_reason: '給与所得者の所得税計算に関する規定',
    relevance_score: 90,
    category: '税制',
    summary: '給与所得者として、所得税の計算方法や控除について定められています。',
  },
  {
    law_id: '321CONSTITUTION',
    law_title: '日本国憲法',
    law_num: '昭和二十一年憲法',
    relevance_reason: '基本的な権利と義務',
    relevance_score: 80,
    category: '基本法',
    summary: '日本国の最高法規として、国民の基本的人権を保障しています。',
  },
];

// Mock keywords
const mockKeywords = [
  '住宅ローン控除',
  '年末調整',
  '所得税',
  '住民税',
  '不動産取得税',
  '登録免許税',
];

export default function LawsDashboardPage() {
  const router = useRouter();
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [dismissedActions, setDismissedActions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Use static mock data instead of API calls to avoid infinite loop
  const recommendations = mockRecommendations;
  const recommendationsLoading = false;
  const recommendationsError = null;
  const keywords = mockKeywords;
  const keywordsLoading = false;

  const handleViewLawDetail = useCallback((lawId: string) => {
    // Navigate to law detail page
    router.push(`/laws/${lawId}`);
  }, [router]);

  const handleSearch = useCallback((query: string) => {
    // Add to recent searches
    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 5);
      return updated;
    });
    // Navigate to search results
    router.push(`/laws/search?q=${encodeURIComponent(query)}`);
  }, [router]);

  const handleActionComplete = useCallback((actionId: string) => {
    setCompletedActions((prev) => [...prev, actionId]);
  }, []);

  const handleActionDismiss = useCallback((actionId: string) => {
    setDismissedActions((prev) => [...prev, actionId]);
  }, []);

  // Filter out completed/dismissed actions
  const visibleActions = mockNextActions.filter(
    (action) =>
      !completedActions.includes(action.id) && !dismissedActions.includes(action.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            法令・制度ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            あなたに関連する法令情報と推奨アクションをまとめて表示
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Widget */}
        <section className="mb-8">
          <LawSearchWidget
            onSearch={handleSearch}
            suggestions={keywords}
            recentSearches={recentSearches}
            placeholder="法令名やキーワードで検索..."
          />
        </section>

        {/* Next Actions */}
        {visibleActions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              おすすめのアクション
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleActions.map((action) => (
                <NextActionCard
                  key={action.id}
                  action={action}
                  onComplete={handleActionComplete}
                  onDismiss={handleActionDismiss}
                />
              ))}
            </div>
          </section>
        )}

        {/* Law Recommendations */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            あなたに関連する法令
          </h2>

          {recommendationsLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-3 text-gray-600">読み込み中...</span>
            </div>
          )}

          {recommendationsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">エラーが発生しました</p>
              <p className="text-sm mt-1">{recommendationsError.message}</p>
            </div>
          )}

          {!recommendationsLoading && !recommendationsError && (
            <>
              {recommendations.length === 0 ? (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-600">
                    関連する法令が見つかりませんでした。
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    プロフィールを更新すると、より適切な法令情報が表示されます。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((recommendation) => (
                    <LawRecommendationCard
                      key={recommendation.law_id}
                      recommendation={recommendation}
                      onViewDetail={handleViewLawDetail}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Personalized Keywords */}
        {!keywordsLoading && keywords.length > 0 && (
          <section className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              あなたにおすすめの検索キーワード
            </h2>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(keyword)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
