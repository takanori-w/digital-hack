'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLawContent, searchLawsByTitle, getLawRecommendations } from '@/lib/laws-api';
import { LawDetail, LawTypeLabels, LawCategoryLabels, LawCategory } from '@/types/laws';
import { useAppStore } from '@/lib/store';
import { EmploymentType, PlannedEvent, ResidenceType } from '@/types/onboarding';

// Category icon mapping
const categoryIcons: Record<LawCategory, string> = {
  tax: '💰',
  labor: '👷',
  social_security: '🏥',
  housing: '🏠',
  family: '👨‍👩‍👧',
  inheritance: '📜',
  pension: '🧓',
  insurance: '🛡️',
  business: '💼',
  education: '📚',
  other: '📋',
};

// Get category from law title
function getCategoryFromTitle(title: string): LawCategory {
  if (title.includes('税') || title.includes('控除')) return 'tax';
  if (title.includes('労働') || title.includes('雇用')) return 'labor';
  if (title.includes('年金')) return 'pension';
  if (title.includes('保険') && !title.includes('年金')) return 'insurance';
  if (title.includes('介護') || title.includes('福祉') || title.includes('医療')) return 'social_security';
  if (title.includes('住宅') || title.includes('借家') || title.includes('不動産')) return 'housing';
  if (title.includes('家族') || title.includes('婚姻') || title.includes('育児') || title.includes('児童')) return 'family';
  if (title.includes('相続') || title.includes('贈与')) return 'inheritance';
  if (title.includes('事業') || title.includes('会社')) return 'business';
  if (title.includes('教育') || title.includes('学校')) return 'education';
  return 'other';
}

// Extended law detail with additional info
interface LawDetailWithMeta {
  detail: LawDetail | null;
  category: LawCategory;
  summary: string;
  relevanceReason?: string;
}

// Map housing type to residence type for API compatibility
const mapHousingToResidence = (housingType: string): ResidenceType | undefined => {
  const mapping: Record<string, ResidenceType> = {
    rent: ResidenceType.RENTAL,
    own: ResidenceType.OWNED,
    with_parents: ResidenceType.PARENTS_HOME,
    company_housing: ResidenceType.COMPANY_HOUSING,
    other: ResidenceType.OTHER,
  };
  return mapping[housingType];
};

// Map occupation string to EmploymentType
const mapOccupationToEmployment = (occupation: string): EmploymentType | undefined => {
  const mapping: Record<string, EmploymentType> = {
    '会社員（正社員）': EmploymentType.FULL_TIME_EMPLOYEE,
    '会社員（契約・派遣）': EmploymentType.CONTRACT_EMPLOYEE,
    '公務員': EmploymentType.CIVIL_SERVANT,
    '自営業・フリーランス': EmploymentType.SELF_EMPLOYED,
    'パート・アルバイト': EmploymentType.PART_TIME,
    '学生': EmploymentType.STUDENT,
    '専業主婦・主夫': EmploymentType.HOMEMAKER,
    '退職・年金生活': EmploymentType.RETIRED,
    '無職・求職中': EmploymentType.UNEMPLOYED,
    'その他': EmploymentType.OTHER,
  };
  return mapping[occupation];
};

// Map future plans to PlannedEvent
const mapFuturePlansToEvents = (plans: string[]): PlannedEvent[] => {
  const mapping: Record<string, PlannedEvent> = {
    side_job: PlannedEvent.SIDE_BUSINESS,
    job_change: PlannedEvent.JOB_CHANGE,
    housing_purchase: PlannedEvent.HOME_PURCHASE,
    inheritance: PlannedEvent.INHERITANCE,
    marriage: PlannedEvent.MARRIAGE,
    childbirth: PlannedEvent.CHILDBIRTH,
    child_education: PlannedEvent.CHILD_EDUCATION,
    retirement: PlannedEvent.RETIREMENT,
    none: PlannedEvent.NONE,
  };
  return plans.map(p => mapping[p]).filter(Boolean) as PlannedEvent[];
};

export default function LawDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lawId = params.lawId as string;
  const { user } = useAppStore();

  const [lawData, setLawData] = useState<LawDetailWithMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Common law summaries
  const getLawSummary = useCallback((title: string): string => {
    const summaries: Record<string, string> = {
      '労働基準法': '労働条件の最低基準を定めた法律です。労働時間、休日、賃金、解雇制限などの基本的な労働条件を規定し、労働者の権利を保護します。',
      '厚生年金保険法': '会社員や公務員が加入する年金制度について定めた法律です。老齢年金、障害年金、遺族年金の給付について規定しています。',
      '雇用保険法': '失業した場合の失業給付や、育児休業給付金、介護休業給付金などについて定めた法律です。',
      '所得税法': '個人の所得に対する税金について定めた法律です。給与所得、事業所得、不動産所得などの計算方法や各種控除を規定しています。',
      '国民健康保険法': '自営業者や無職の方などが加入する医療保険制度について定めた法律です。',
      '国民年金法': '日本に住む20歳以上60歳未満のすべての方が加入する基礎年金制度について定めた法律です。',
      '介護保険法': '40歳以上の方を対象とした介護保険制度について定めた法律です。介護サービスの利用方法や保険料について規定しています。',
      '育児休業法': '育児休業、介護休業、子の看護休暇などについて定めた法律です。正式名称は「育児休業、介護休業等育児又は家族介護を行う労働者の福祉に関する法律」です。',
      '相続税法': '相続や贈与に対する税金について定めた法律です。基礎控除や税率、各種特例について規定しています。',
      '借地借家法': '土地や建物の賃貸借契約について定めた法律です。借主（テナント）の権利を保護する規定が含まれています。',
      '消費税法': '商品やサービスの購入時にかかる消費税について定めた法律です。事業者の納税義務や軽減税率について規定しています。',
      '労働契約法': '労働契約の基本的なルールを定めた法律です。労働条件の明示、解雇の制限、有期労働契約のルールなどを規定しています。',
      '健康保険法': '会社員とその家族が加入する健康保険制度について定めた法律です。医療費の給付や傷病手当金について規定しています。',
    };
    return summaries[title] || `${title}の詳細な内容については、条文をご確認いただくか、専門家にご相談ください。`;
  }, []);

  // Get relevance reason based on user profile
  const getRelevanceReason = useCallback((title: string): string | undefined => {
    if (!user) return undefined;

    const employmentType = mapOccupationToEmployment(user.occupation);
    const plannedEvents = user.futurePlans ? mapFuturePlansToEvents(user.futurePlans) : undefined;
    const residenceType = mapHousingToResidence(user.housingType);

    const recommendations = getLawRecommendations(
      employmentType,
      plannedEvents,
      residenceType
    );

    const matchingRec = recommendations.find(r =>
      r.law_title === title || title.includes(r.law_title) || r.law_title.includes(title)
    );

    return matchingRec?.relevance_reason;
  }, [user]);

  useEffect(() => {
    async function fetchLawDetail() {
      if (!lawId) {
        setError('法令IDが指定されていません');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // First try to get content by law ID
        let detail = await getLawContent(lawId);

        // If not found, the lawId might be a custom ID from recommendations
        // Try to search by title extracted from the ID
        if (!detail && lawId.includes('_')) {
          // Handle custom IDs like 'emp_FULL_TIME_EMPLOYEE_0'
          // These are generated IDs, so we need to look up the actual law

          // Try to find the law in recommendations
          if (user) {
            const employmentType = mapOccupationToEmployment(user.occupation);
            const plannedEvents = user.futurePlans ? mapFuturePlansToEvents(user.futurePlans) : undefined;
            const residenceType = mapHousingToResidence(user.housingType);

            const recommendations = getLawRecommendations(
              employmentType,
              plannedEvents,
              residenceType
            );

            const matchingRec = recommendations.find(r => r.law_id === lawId);
            if (matchingRec) {
              // Search for the actual law by title
              const searchResults = await searchLawsByTitle([matchingRec.law_title]);
              if (searchResults.length > 0) {
                detail = await getLawContent(searchResults[0].law_id);
              }

              // If still no detail, create a synthetic detail from recommendation
              if (!detail) {
                detail = {
                  law_id: lawId,
                  law_num: matchingRec.law_num || '（法令番号未取得）',
                  law_title: matchingRec.law_title,
                  law_type: 'Act',
                  promulgation_date: '',
                  enforcement_date: '',
                  content: {
                    articles: [],
                  },
                };
              }
            }
          }
        }

        if (detail) {
          const category = getCategoryFromTitle(detail.law_title);
          const summary = getLawSummary(detail.law_title);
          const relevanceReason = getRelevanceReason(detail.law_title);

          setLawData({
            detail,
            category,
            summary,
            relevanceReason,
          });
        } else {
          // Create fallback detail for display
          setLawData({
            detail: {
              law_id: lawId,
              law_num: '（法令番号未取得）',
              law_title: decodeURIComponent(lawId).replace(/_/g, ' '),
              law_type: 'Act',
              promulgation_date: '',
              enforcement_date: '',
              content: { articles: [] },
            },
            category: 'other',
            summary: 'この法令の詳細情報を取得できませんでした。e-Gov法令検索で直接お調べください。',
            relevanceReason: undefined,
          });
        }
      } catch (err) {
        console.error('Failed to fetch law detail:', err);
        setError('法令情報の取得に失敗しました。しばらくしてから再度お試しください。');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLawDetail();
  }, [lawId, user, getLawSummary, getRelevanceReason]);

  const handleBackClick = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">エラー</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleBackClick}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← 戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lawData?.detail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">法令が見つかりません</h1>
            <p className="text-gray-600 mb-6">
              指定された法令の情報を取得できませんでした。
            </p>
            <button
              onClick={handleBackClick}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← 戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { detail, category, summary, relevanceReason } = lawData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={handleBackClick}
          className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span className="mr-2">←</span>
          戻る
        </button>

        {/* Main content card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <div className="flex items-start gap-4">
              <span className="text-4xl">{categoryIcons[category]}</span>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{detail.law_title}</h1>
                <div className="flex flex-wrap gap-4 text-blue-100 text-sm">
                  <span className="flex items-center gap-1">
                    <span>📋</span>
                    {detail.law_num || '法令番号なし'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📁</span>
                    {LawCategoryLabels[category]}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📄</span>
                    {LawTypeLabels[detail.law_type]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Relevance reason (if available) */}
            {relevanceReason && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">💡</span>
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">
                      あなたに関連する理由
                    </h3>
                    <p className="text-green-700">{relevanceReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span>📝</span>
                概要
              </h2>
              <p className="text-gray-700 leading-relaxed">{summary}</p>
            </div>

            {/* Dates */}
            {(detail.promulgation_date || detail.enforcement_date) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detail.promulgation_date && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">公布日</h3>
                    <p className="text-gray-800">{detail.promulgation_date}</p>
                  </div>
                )}
                {detail.enforcement_date && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">施行日</h3>
                    <p className="text-gray-800">{detail.enforcement_date}</p>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-600 text-xl">⚠️</span>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">ご注意</p>
                  <p>
                    この情報は参考目的で提供されています。法律の詳細な解釈や具体的な適用については、
                    弁護士、税理士、社会保険労務士などの専門家にご相談ください。
                    法律は改正される場合があります。最新の情報は
                    <a
                      href="https://laws.e-gov.go.jp/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      e-Gov法令検索
                    </a>
                    でご確認ください。
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
              <a
                href={`https://laws.e-gov.go.jp/search?keyword=${encodeURIComponent(detail.law_title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">🔍</span>
                e-Gov法令検索で開く
              </a>
              <Link
                href="/app/dashboard/laws"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="mr-2">📊</span>
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
