'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { LawRecommendation, LawCategoryLabels, LawCategory } from '@/types/laws';
import {
  Scale,
  ChevronRight,
  BookOpen,
  Search,
  Filter,
  ExternalLink,
  Info,
  Briefcase,
  Home,
  Users,
  Wallet,
  Heart,
  GraduationCap,
  Building2,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface LawsPanelProps {
  maxItems?: number;
  showSearch?: boolean;
  compact?: boolean;
}

const categoryIcons: Record<LawCategory, typeof Scale> = {
  tax: Wallet,
  labor: Briefcase,
  social_security: Shield,
  housing: Home,
  family: Users,
  inheritance: Scale,
  pension: Heart,
  insurance: Shield,
  business: Building2,
  education: GraduationCap,
  other: BookOpen,
};

export default function LawsPanel({
  maxItems = 5,
  showSearch = true,
  compact = false,
}: LawsPanelProps) {
  const { user } = useAppStore();
  const [recommendations, setRecommendations] = useState<LawRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LawCategory | 'all'>('all');
  const [expandedLaw, setExpandedLaw] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('action', 'recommendations');

      if (user?.occupation) {
        // Map occupation to employment type
        const employmentTypeMap: Record<string, string> = {
          '会社員': 'FULL_TIME_EMPLOYEE',
          '会社員（正社員）': 'FULL_TIME_EMPLOYEE',
          '会社員（契約・派遣）': 'CONTRACT_EMPLOYEE',
          '公務員': 'CIVIL_SERVANT',
          '自営業': 'SELF_EMPLOYED',
          '自営業・フリーランス': 'SELF_EMPLOYED',
          'パート・アルバイト': 'PART_TIME',
          '学生': 'STUDENT',
          '専業主婦・主夫': 'HOMEMAKER',
          '年金受給者・退職者': 'RETIRED',
          '求職中': 'UNEMPLOYED',
        };
        const employmentType = employmentTypeMap[user.occupation] || 'OTHER';
        params.append('employmentType', employmentType);
      }

      if (user?.futurePlans?.length) {
        // Map future plans to planned events
        const eventMap: Record<string, string> = {
          'side_job': 'SIDE_BUSINESS',
          'job_change': 'JOB_CHANGE',
          'housing_purchase': 'HOME_PURCHASE',
          'inheritance': 'INHERITANCE',
          'nursing_care': 'NURSING_CARE',
          'retirement': 'RETIREMENT',
          'marriage': 'MARRIAGE',
          'childbirth': 'CHILDBIRTH',
          'child_education': 'CHILD_EDUCATION',
          'relocation': 'RELOCATION',
        };

        user.futurePlans.forEach((plan) => {
          const event = eventMap[plan];
          if (event) {
            params.append('plannedEvent', event);
          }
        });
      }

      if (user?.housingType) {
        // Map HousingType to ResidenceType (from types/index.ts)
        const residenceMap: Record<string, string> = {
          'rent': 'RENTAL',
          'own': 'OWNED',
          'with_parents': 'PARENTS_HOME',
          'company_housing': 'COMPANY_HOUSING',
          'other': 'OTHER',
          // Also support Japanese labels
          '賃貸': 'RENTAL',
          '持ち家': 'OWNED',
          '実家': 'PARENTS_HOME',
          '社宅・寮': 'COMPANY_HOUSING',
          '公営住宅': 'PUBLIC_HOUSING',
        };
        const residenceType = residenceMap[user.housingType] || 'OTHER';
        params.append('residenceType', residenceType);
      }

      const response = await fetch(`/api/laws?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data);
      } else {
        setError(data.error || '法令情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch law recommendations:', err);
      setError('法令情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Filter recommendations based on search and category
  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesSearch =
      searchQuery === '' ||
      rec.law_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.relevance_reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || rec.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const displayedRecommendations = filteredRecommendations.slice(0, maxItems);

  // Get unique categories from recommendations
  const availableCategories = Array.from(
    new Set(recommendations.map((r) => r.category))
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary-600 animate-spin" />
          <span className="ml-2 text-gray-600">法令情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-center py-8 text-red-600">
          <Info className="w-5 h-5 mr-2" />
          {error}
        </div>
        <button
          onClick={fetchRecommendations}
          className="mt-4 w-full py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">
              あなたに関連する法令・制度
            </h3>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {filteredRecommendations.length}件
          </span>
        </div>

        {/* Search and Filter */}
        {showSearch && !compact && (
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="法令を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {availableCategories.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {LawCategoryLabels[category]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Law List */}
      <div className="divide-y divide-gray-100">
        {displayedRecommendations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchQuery || selectedCategory !== 'all'
              ? '該当する法令が見つかりませんでした'
              : 'プロフィールを完成させると、関連する法令が表示されます'}
          </div>
        ) : (
          displayedRecommendations.map((rec) => {
            const CategoryIcon = categoryIcons[rec.category];
            const isExpanded = expandedLaw === rec.law_id;

            return (
              <div
                key={rec.law_id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setExpandedLaw(isExpanded ? null : rec.law_id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      compact ? 'w-8 h-8' : ''
                    }`}
                    style={{
                      backgroundColor: getCategoryColor(rec.category, 0.1),
                    }}
                  >
                    <CategoryIcon
                      className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`}
                      style={{ color: getCategoryColor(rec.category) }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {rec.law_title}
                      </h4>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: getCategoryColor(rec.category, 0.1),
                          color: getCategoryColor(rec.category),
                        }}
                      >
                        {LawCategoryLabels[rec.category]}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {rec.relevance_reason}
                    </p>

                    {/* Expanded content */}
                    {isExpanded && rec.summary && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{rec.summary}</p>

                        {rec.key_articles && rec.key_articles.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              関連する条文:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rec.key_articles.map((article, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                                >
                                  {article}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <a
                          href={`https://elaws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0500/viewContents?lawId=${rec.law_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                          e-Gov法令検索で詳細を見る
                        </a>
                      </div>
                    )}
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer - View All */}
      {filteredRecommendations.length > maxItems && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => {
              // TODO: Navigate to full laws page
            }}
            className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1"
          >
            すべての関連法令を見る（{filteredRecommendations.length}件）
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Footer */}
      {!compact && (
        <div className="p-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-blue-700 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              この情報は参考目的で提供されています。
              具体的な手続きや申請については、各機関や専門家にご相談ください。
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to get category color
function getCategoryColor(category: LawCategory, opacity?: number): string {
  const colors: Record<LawCategory, string> = {
    tax: '#f59e0b',
    labor: '#3b82f6',
    social_security: '#10b981',
    housing: '#8b5cf6',
    family: '#ec4899',
    inheritance: '#6366f1',
    pension: '#14b8a6',
    insurance: '#06b6d4',
    business: '#f97316',
    education: '#84cc16',
    other: '#6b7280',
  };

  const color = colors[category] || colors.other;

  if (opacity !== undefined) {
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
}
