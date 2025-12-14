import { NextRequest, NextResponse } from 'next/server';
import { BenefitInfo, LifeStage, BenefitSearchParams } from '@/types';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Mock benefits data (in production, this would come from a database)
const MOCK_BENEFITS: BenefitInfo[] = [
  {
    id: '1',
    title: '住宅ローン減税',
    description: '住宅ローンを組んで住宅を取得した場合、年末のローン残高の0.7%が13年間所得税から控除されます。',
    category: 'tax',
    amount: 350000,
    targetLifeStages: ['newlywed', 'child_rearing', 'child_education'],
    targetPrefectures: ['全国'],
    source: '国税庁',
    createdAt: '2024-01-01',
    priority: 'high',
  },
  {
    id: '2',
    title: '出産育児一時金',
    description: '出産時に健康保険から50万円が支給されます。医療機関への直接支払制度も利用可能。',
    category: 'subsidy',
    amount: 500000,
    targetLifeStages: ['expecting', 'child_rearing'],
    targetPrefectures: ['全国'],
    source: '厚生労働省',
    createdAt: '2024-01-01',
    priority: 'high',
  },
  {
    id: '3',
    title: '児童手当',
    description: '中学校卒業まで（15歳の誕生日後の最初の3月31日まで）の児童を養育している方に支給。',
    category: 'subsidy',
    amount: 180000,
    targetLifeStages: ['child_rearing', 'child_education'],
    targetPrefectures: ['全国'],
    source: '内閣府',
    createdAt: '2024-01-01',
    priority: 'high',
  },
  {
    id: '4',
    title: 'ふるさと納税',
    description: '応援したい自治体に寄付をすると、寄付金のうち2,000円を超える部分が所得税・住民税から控除されます。',
    category: 'tax',
    targetLifeStages: ['working_single', 'newlywed', 'child_rearing', 'child_education', 'empty_nest', 'pre_retirement'],
    targetPrefectures: ['全国'],
    source: '総務省',
    createdAt: '2024-01-01',
    priority: 'medium',
  },
  {
    id: '5',
    title: 'iDeCo（個人型確定拠出年金）',
    description: '掛金が全額所得控除、運用益が非課税、受取時も控除あり。老後資金の準備に最適。',
    category: 'investment',
    targetLifeStages: ['new_graduate', 'working_single', 'newlywed', 'child_rearing', 'child_education', 'empty_nest', 'pre_retirement'],
    targetPrefectures: ['全国'],
    source: '厚生労働省',
    createdAt: '2024-01-01',
    priority: 'high',
  },
  {
    id: '6',
    title: '東京都ベビーシッター利用支援事業',
    description: '認可保育所等の利用が困難な場合、ベビーシッター利用料の一部を補助。1時間あたり最大2,400円。',
    category: 'subsidy',
    amount: 288000,
    targetLifeStages: ['child_rearing'],
    targetPrefectures: ['東京都'],
    source: '東京都福祉局',
    createdAt: '2024-01-01',
    priority: 'medium',
  },
  {
    id: '7',
    title: 'PayPayキャンペーン（港区）',
    description: '港区内の対象店舗でPayPay決済をすると最大20%還元。期間限定キャンペーン。',
    category: 'campaign',
    deadline: '2025-01-31',
    targetLifeStages: ['working_single', 'newlywed', 'child_rearing', 'child_education', 'empty_nest', 'pre_retirement', 'retired'],
    targetPrefectures: ['東京都'],
    source: '港区',
    createdAt: '2024-12-01',
    priority: 'medium',
  },
  {
    id: '8',
    title: 'NISA（少額投資非課税制度）',
    description: '年間最大360万円の投資が非課税に。つみたて投資枠と成長投資枠を併用可能。',
    category: 'investment',
    targetLifeStages: ['new_graduate', 'working_single', 'newlywed', 'child_rearing', 'child_education', 'empty_nest', 'pre_retirement', 'retired'],
    targetPrefectures: ['全国'],
    source: '金融庁',
    createdAt: '2024-01-01',
    priority: 'high',
  },
];

/**
 * Sanitize search keyword
 */
function sanitizeKeyword(keyword: string): string {
  return keyword
    .trim()
    .slice(0, 100) // Limit length
    .replace(/[<>]/g, ''); // Remove potential XSS characters
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse search parameters
    const params: BenefitSearchParams = {
      keyword: searchParams.get('keyword') || undefined,
      category: searchParams.getAll('category') as BenefitInfo['category'][],
      prefecture: searchParams.get('prefecture') || undefined,
      lifeStage: (searchParams.get('lifeStage') as LifeStage) || undefined,
      sortBy: (searchParams.get('sortBy') as BenefitSearchParams['sortBy']) || 'relevance',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Validate pagination
    params.page = Math.max(1, params.page || 1);
    params.limit = Math.min(100, Math.max(1, params.limit || 20));

    let results = [...MOCK_BENEFITS];

    // Keyword search
    if (params.keyword) {
      const keyword = sanitizeKeyword(params.keyword).toLowerCase();
      results = results.filter(
        (b) =>
          b.title.toLowerCase().includes(keyword) ||
          b.description.toLowerCase().includes(keyword)
      );
    }

    // Category filter
    if (params.category && params.category.length > 0) {
      results = results.filter((b) => params.category!.includes(b.category));
    }

    // Prefecture filter
    if (params.prefecture && params.prefecture !== '全国') {
      results = results.filter(
        (b) =>
          b.targetPrefectures.includes('全国') ||
          b.targetPrefectures.includes(params.prefecture!)
      );
    }

    // Life stage filter
    if (params.lifeStage) {
      results = results.filter((b) =>
        b.targetLifeStages.includes(params.lifeStage!)
      );
    }

    // Sorting
    if (params.sortBy === 'deadline') {
      results.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    } else if (params.sortBy === 'amount') {
      results.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    } else {
      // Relevance - prioritize by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      results.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    // Pagination
    const total = results.length;
    const totalPages = Math.ceil(total / params.limit!);
    const startIndex = (params.page! - 1) * params.limit!;
    const paginatedResults = results.slice(startIndex, startIndex + params.limit!);

    return NextResponse.json({
      benefits: paginatedResults,
      total,
      page: params.page,
      totalPages,
    });
  } catch (error) {
    console.error('Benefits search error:', error);
    return NextResponse.json(
      { error: '検索中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
