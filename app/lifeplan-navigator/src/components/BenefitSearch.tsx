'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  Calendar,
  ExternalLink,
  Tag,
  MapPin,
  Users,
  X,
  Compass,
} from 'lucide-react';
import { BenefitInfo, LifeStage, BenefitSearchParams } from '@/types';
import { mockBenefits, lifeStages } from '@/data/mockData';
import { useAppStore } from '@/lib/store';

const CATEGORIES = [
  { value: 'subsidy', label: '補助金・給付金', color: 'bg-green-100 text-green-800' },
  { value: 'tax', label: '税制優遇', color: 'bg-blue-100 text-blue-800' },
  { value: 'campaign', label: 'キャンペーン', color: 'bg-purple-100 text-purple-800' },
  { value: 'insurance', label: '保険', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'investment', label: '投資・運用', color: 'bg-orange-100 text-orange-800' },
];

const PREFECTURES = ['全国', '東京都', '神奈川県', '大阪府', '愛知県', '福岡県'];

export default function BenefitSearch() {
  const { currentLifeStage } = useAppStore();

  const [searchParams, setSearchParams] = useState<BenefitSearchParams>({
    keyword: '',
    category: [],
    prefecture: '',
    lifeStage: currentLifeStage,
    sortBy: 'relevance',
  });

  const [showFilters, setShowFilters] = useState(false);

  const filteredBenefits = useMemo(() => {
    let results = [...mockBenefits];

    // Keyword search
    if (searchParams.keyword) {
      const keyword = searchParams.keyword.toLowerCase();
      results = results.filter(
        (b) =>
          b.title.toLowerCase().includes(keyword) ||
          b.description.toLowerCase().includes(keyword)
      );
    }

    // Category filter
    if (searchParams.category && searchParams.category.length > 0) {
      results = results.filter((b) =>
        searchParams.category!.includes(b.category)
      );
    }

    // Prefecture filter
    if (searchParams.prefecture && searchParams.prefecture !== '全国') {
      results = results.filter(
        (b) =>
          b.targetPrefectures.includes('全国') ||
          b.targetPrefectures.includes(searchParams.prefecture!)
      );
    }

    // Life stage filter
    if (searchParams.lifeStage) {
      results = results.filter((b) =>
        b.targetLifeStages.includes(searchParams.lifeStage!)
      );
    }

    // Sorting
    if (searchParams.sortBy === 'deadline') {
      results.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    } else if (searchParams.sortBy === 'amount') {
      results.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    } else {
      // Relevance - prioritize by priority and life stage match
      results.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    }

    return results;
  }, [searchParams]);

  const toggleCategory = (category: BenefitInfo['category']) => {
    const current = searchParams.category || [];
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setSearchParams({ ...searchParams, category: updated });
  };

  const clearFilters = () => {
    setSearchParams({
      keyword: '',
      category: [],
      prefecture: '',
      lifeStage: currentLifeStage,
      sortBy: 'relevance',
    });
  };

  const hasActiveFilters =
    (searchParams.category && searchParams.category.length > 0) ||
    searchParams.prefecture ||
    searchParams.lifeStage !== currentLifeStage;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">補助金・制度検索</h1>
            </div>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ダッシュボードへ
            </a>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchParams.keyword}
              onChange={(e) =>
                setSearchParams({ ...searchParams, keyword: e.target.value })
              }
              placeholder="キーワードで検索（例：住宅ローン、児童手当）"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter toggle */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Filter className="w-4 h-4" />
              フィルター
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
              />
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  適用中
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700"
              >
                フィルターをクリア
              </button>
            )}
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="border-t bg-gray-50 px-4 py-4">
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() =>
                        toggleCategory(cat.value as BenefitInfo['category'])
                      }
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        searchParams.category?.includes(
                          cat.value as BenefitInfo['category']
                        )
                          ? cat.color
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prefecture and Life Stage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    地域
                  </label>
                  <select
                    value={searchParams.prefecture || ''}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        prefecture: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">すべて</option>
                    {PREFECTURES.map((pref) => (
                      <option key={pref} value={pref}>
                        {pref}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ライフステージ
                  </label>
                  <select
                    value={searchParams.lifeStage || ''}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        lifeStage: e.target.value as LifeStage,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">すべて</option>
                    {lifeStages.map((stage) => (
                      <option key={stage.stage} value={stage.stage}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  並び替え
                </label>
                <select
                  value={searchParams.sortBy || 'relevance'}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      sortBy: e.target.value as BenefitSearchParams['sortBy'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">おすすめ順</option>
                  <option value="deadline">期限が近い順</option>
                  <option value="amount">金額が大きい順</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Results */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-600 mb-4">
          {filteredBenefits.length}件の制度が見つかりました
        </p>

        <div className="space-y-4">
          {filteredBenefits.map((benefit) => (
            <BenefitCard key={benefit.id} benefit={benefit} />
          ))}
        </div>

        {filteredBenefits.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              該当する制度が見つかりません
            </h3>
            <p className="text-gray-600">
              検索条件を変更して再度お試しください
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function BenefitCard({ benefit }: { benefit: BenefitInfo }) {
  const categoryInfo = CATEGORIES.find((c) => c.value === benefit.category);

  const formatAmount = (amount?: number) => {
    if (!amount) return null;
    if (amount >= 10000) {
      return `${(amount / 10000).toLocaleString()}万円`;
    }
    return `${amount.toLocaleString()}円`;
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const daysLeft = getDaysUntilDeadline(benefit.deadline);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${categoryInfo?.color}`}
            >
              {categoryInfo?.label}
            </span>
            {benefit.priority === 'high' && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                おすすめ
              </span>
            )}
            {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                残り{daysLeft}日
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {benefit.title}
          </h3>

          <p className="text-sm text-gray-600 mb-3">{benefit.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {benefit.amount && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                最大{formatAmount(benefit.amount)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {benefit.targetPrefectures.join(', ')}
            </span>
            {benefit.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                期限: {benefit.deadline}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {benefit.targetLifeStages
                .slice(0, 3)
                .map(
                  (s) =>
                    lifeStages.find((ls) => ls.stage === s)?.label || s
                )
                .join(', ')}
              {benefit.targetLifeStages.length > 3 && '...'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {benefit.applicationUrl && (
            <a
              href={benefit.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              申請する
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <span className="text-xs text-gray-400">{benefit.source}</span>
        </div>
      </div>
    </div>
  );
}
