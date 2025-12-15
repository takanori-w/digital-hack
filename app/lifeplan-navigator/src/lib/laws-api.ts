/**
 * Laws API Service
 * Handles communication with the e-Gov Laws API v2
 * Reference: https://laws.e-gov.go.jp/api/2
 *
 * Enhanced with:
 * - Term dictionary for handling terminology variations (表記揺れ対応)
 * - Improved API client with better error handling
 */

import {
  LawSearchResult,
  LawDetail,
  LawSearchParams,
  LawRecommendation,
  LawCategory,
  PlannedEventToLawCategory,
  EmploymentTypeToLaws,
  LawCategoryLabels,
} from '@/types/laws';
import { EmploymentType, PlannedEvent, ResidenceType } from '@/types/onboarding';
import { lawsApiClient } from './laws-api-client';
import {
  translateToLegalTerms,
  getKeywordsForUserAttributes,
  getAgeCategory,
} from './laws-term-dictionary';

const EGOV_API_BASE_URL = 'https://laws.e-gov.go.jp/api/2';

// Cache for law search results (simple in-memory cache)
const lawCache = new Map<string, { data: LawSearchResult[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

/**
 * Search laws by keywords
 * Enhanced with term dictionary translation for better search results
 */
export async function searchLawsByKeyword(
  keywords: string[],
  options: Partial<LawSearchParams> = {}
): Promise<LawSearchResult[]> {
  // Expand keywords using term dictionary (表記揺れ対応)
  const expandedKeywords = new Set<string>();
  keywords.forEach(kw => {
    expandedKeywords.add(kw);
    // Add legal term translations
    const legalTerms = translateToLegalTerms(kw);
    legalTerms.forEach(term => expandedKeywords.add(term));
  });

  const allKeywords = Array.from(expandedKeywords);
  const cacheKey = `keyword:${allKeywords.join(',')}:${JSON.stringify(options)}`;
  const cached = lawCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Try using the new API client first
  try {
    const apiResponse = await lawsApiClient.searchByKeyword(allKeywords.join(' '), {
      limit: options.limit || 10,
      offset: options.offset || 0,
      lawType: options.law_type as never,
      asOf: options.date_from,
    });

    if (!apiResponse.hasError && apiResponse.items.length > 0) {
      const results: LawSearchResult[] = apiResponse.items.map(item => ({
        law_id: item.lawId,
        law_num: item.lawNum,
        law_title: item.lawTitle,
        law_type: item.lawType as LawSearchResult['law_type'],
        promulgation_date: item.promulgationDate,
        repeal_status: 'active',
        matched_sentences: item.matchedSentences?.map(s => ({
          article_num: s.articleNum,
          article_title: s.articleTitle,
          sentence: s.sentence,
          highlighted_sentence: s.highlightedSentence,
        })),
      }));

      lawCache.set(cacheKey, { data: results, timestamp: Date.now() });
      return results;
    }
  } catch (clientError) {
    console.warn('New API client failed, falling back to direct fetch:', clientError);
  }

  // Fallback to direct fetch
  const params = new URLSearchParams();
  allKeywords.forEach(kw => params.append('keyword', kw));

  if (options.law_type?.length) {
    options.law_type.forEach(type => params.append('lawType', type));
  }
  if (options.date_from) {
    params.append('promulgationDateFrom', options.date_from);
  }
  if (options.date_to) {
    params.append('promulgationDateTo', options.date_to);
  }
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }
  if (options.offset) {
    params.append('offset', options.offset.toString());
  }

  try {
    const response = await fetch(`${EGOV_API_BASE_URL}/laws?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const results = parseLawSearchResults(data);

    lawCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (error) {
    console.error('Law search failed:', error);
    // Return fallback data on error
    return getFallbackLaws(keywords);
  }
}

/**
 * Search laws by title
 */
export async function searchLawsByTitle(
  titleKeywords: string[],
  options: Partial<LawSearchParams> = {}
): Promise<LawSearchResult[]> {
  const cacheKey = `title:${titleKeywords.join(',')}:${JSON.stringify(options)}`;
  const cached = lawCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const params = new URLSearchParams();
  titleKeywords.forEach(kw => params.append('lawTitle', kw));

  if (options.law_type?.length) {
    options.law_type.forEach(type => params.append('lawType', type));
  }
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }
  if (!options.include_repealed) {
    params.append('repealStatus', 'active');
  }

  try {
    const response = await fetch(`${EGOV_API_BASE_URL}/laws?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const results = parseLawSearchResults(data);

    lawCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (error) {
    console.error('Law title search failed:', error);
    return getFallbackLaws(titleKeywords);
  }
}

/**
 * Get law content by ID
 */
export async function getLawContent(
  lawId: string,
  options: { extractArticles?: string[]; targetDate?: string } = {}
): Promise<LawDetail | null> {
  try {
    const params = new URLSearchParams();
    if (options.targetDate) {
      params.append('targetDate', options.targetDate);
    }

    const response = await fetch(
      `${EGOV_API_BASE_URL}/laws/${lawId}${params.toString() ? '?' + params.toString() : ''}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return parseLawDetail(data, options.extractArticles);
  } catch (error) {
    console.error('Get law content failed:', error);
    return null;
  }
}

// Mapping of law titles to e-Gov law IDs and law numbers
// e-Gov URL format: https://elaws.e-gov.go.jp/document?lawid={lawId}
const LAW_INFO_MAP: Record<string, { lawId: string; lawNum: string }> = {
  '労働基準法': { lawId: '322AC0000000049', lawNum: '昭和二十二年法律第四十九号' },
  '厚生年金保険法': { lawId: '329AC0000000115', lawNum: '昭和二十九年法律第百十五号' },
  '雇用保険法': { lawId: '349AC0000000116', lawNum: '昭和四十九年法律第百十六号' },
  '所得税法': { lawId: '340AC0000000033', lawNum: '昭和四十年法律第三十三号' },
  '国民健康保険法': { lawId: '333AC0000000192', lawNum: '昭和三十三年法律第百九十二号' },
  '国民年金法': { lawId: '334AC0000000141', lawNum: '昭和三十四年法律第百四十一号' },
  '介護保険法': { lawId: '409AC0000000123', lawNum: '平成九年法律第百二十三号' },
  '育児休業法': { lawId: '403AC0000000076', lawNum: '平成三年法律第七十六号' },
  '相続税法': { lawId: '325AC0000000073', lawNum: '昭和二十五年法律第七十三号' },
  '借地借家法': { lawId: '403AC0000000090', lawNum: '平成三年法律第九十号' },
  '消費税法': { lawId: '363AC0000000108', lawNum: '昭和六十三年法律第百八号' },
  '健康保険法': { lawId: '311AC0000000070', lawNum: '大正十一年法律第七十号' },
  '国家公務員法': { lawId: '322AC0000000120', lawNum: '昭和二十二年法律第百二十号' },
  '地方公務員法': { lawId: '325AC0000000261', lawNum: '昭和二十五年法律第二百六十一号' },
  '労働契約法': { lawId: '419AC0000000128', lawNum: '平成十九年法律第百二十八号' },
  '労働者派遣法': { lawId: '360AC0000000088', lawNum: '昭和六十年法律第八十八号' },
  '確定拠出年金法': { lawId: '413AC0000000088', lawNum: '平成十三年法律第八十八号' },
  '児童手当法': { lawId: '346AC0000000073', lawNum: '昭和四十六年法律第七十三号' },
  '租税特別措置法': { lawId: '332AC0000000026', lawNum: '昭和三十二年法律第二十六号' },
  '不動産取得税': { lawId: '325AC0000000226', lawNum: '昭和二十五年法律第二百二十六号' },
  '登録免許税法': { lawId: '342AC0000000035', lawNum: '昭和四十二年法律第三十五号' },
  '高齢者雇用安定法': { lawId: '346AC0000000068', lawNum: '昭和四十六年法律第六十八号' },
  '公営住宅法': { lawId: '326AC0000000193', lawNum: '昭和二十六年法律第百九十三号' },
  // Aliases for commonly used terms that map to actual laws
  '住宅ローン控除': { lawId: '332AC0000000026', lawNum: '昭和三十二年法律第二十六号' }, // 租税特別措置法
  '登録免許税': { lawId: '342AC0000000035', lawNum: '昭和四十二年法律第三十五号' }, // 登録免許税法
  '配偶者控除': { lawId: '340AC0000000033', lawNum: '昭和四十年法律第三十三号' }, // 所得税法
  '配偶者特別控除': { lawId: '340AC0000000033', lawNum: '昭和四十年法律第三十三号' }, // 所得税法
  '医療費控除': { lawId: '340AC0000000033', lawNum: '昭和四十年法律第三十三号' }, // 所得税法
  '贈与税': { lawId: '325AC0000000073', lawNum: '昭和二十五年法律第七十三号' }, // 相続税法
  '固定資産税': { lawId: '325AC0000000226', lawNum: '昭和二十五年法律第二百二十六号' }, // 地方税法
  '住民税': { lawId: '325AC0000000226', lawNum: '昭和二十五年法律第二百二十六号' }, // 地方税法
};

/**
 * Get e-Gov law ID from law title
 */
function getLawIdFromTitle(lawTitle: string): string {
  const info = LAW_INFO_MAP[lawTitle];
  return info?.lawId || '';
}

/**
 * Get law number from law title
 */
function getLawNumFromTitle(lawTitle: string): string {
  const info = LAW_INFO_MAP[lawTitle];
  return info?.lawNum || '';
}

/**
 * Get law recommendations based on user profile
 */
export function getLawRecommendations(
  employmentType?: EmploymentType,
  plannedEvents?: PlannedEvent[],
  residenceType?: ResidenceType
): LawRecommendation[] {
  const recommendations: LawRecommendation[] = [];
  const addedLaws = new Set<string>();

  // Add laws based on employment type
  if (employmentType) {
    const employmentLaws = EmploymentTypeToLaws[employmentType] || [];
    employmentLaws.forEach((lawTitle, index) => {
      if (!addedLaws.has(lawTitle)) {
        addedLaws.add(lawTitle);
        const lawId = getLawIdFromTitle(lawTitle);
        recommendations.push({
          law_id: lawId || `emp_${employmentType}_${index}`,
          law_title: lawTitle,
          law_num: getLawNumFromTitle(lawTitle),
          relevance_reason: getEmploymentRelevanceReason(employmentType),
          relevance_score: 0.9 - index * 0.1,
          category: getEmploymentCategory(lawTitle),
          summary: getLawSummary(lawTitle),
        });
      }
    });
  }

  // Add laws based on planned events
  if (plannedEvents?.length) {
    plannedEvents.forEach((event) => {
      const categories = PlannedEventToLawCategory[event] || [];
      const eventLaws = getEventRelatedLaws(event);

      eventLaws.forEach((lawTitle, index) => {
        if (!addedLaws.has(lawTitle)) {
          addedLaws.add(lawTitle);
          const lawId = getLawIdFromTitle(lawTitle);
          recommendations.push({
            law_id: lawId || `event_${event}_${index}`,
            law_title: lawTitle,
            law_num: getLawNumFromTitle(lawTitle),
            relevance_reason: getEventRelevanceReason(event),
            relevance_score: 0.85 - index * 0.1,
            category: categories[0] || 'other',
            summary: getLawSummary(lawTitle),
          });
        }
      });
    });
  }

  // Add laws based on residence type
  if (residenceType) {
    const residenceLaws = getResidenceRelatedLaws(residenceType);
    residenceLaws.forEach((lawTitle, index) => {
      if (!addedLaws.has(lawTitle)) {
        addedLaws.add(lawTitle);
        const lawId = getLawIdFromTitle(lawTitle);
        recommendations.push({
          law_id: lawId || `res_${residenceType}_${index}`,
          law_title: lawTitle,
          law_num: getLawNumFromTitle(lawTitle),
          relevance_reason: getResidenceRelevanceReason(residenceType),
          relevance_score: 0.7 - index * 0.1,
          category: 'housing',
          summary: getLawSummary(lawTitle),
        });
      }
    });
  }

  // Sort by relevance score
  return recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
}

// Helper functions

function parseLawSearchResults(data: unknown): LawSearchResult[] {
  if (!data || typeof data !== 'object') return [];

  const laws = (data as Record<string, unknown>).laws;
  if (!Array.isArray(laws)) return [];

  return laws.map((law: Record<string, unknown>) => ({
    law_id: String(law.lawId || law.law_id || ''),
    law_num: String(law.lawNum || law.law_num || ''),
    law_title: String(law.lawTitle || law.law_title || ''),
    law_title_kana: law.lawTitleKana ? String(law.lawTitleKana) : undefined,
    law_title_en: law.lawTitleEn ? String(law.lawTitleEn) : undefined,
    promulgation_date: law.promulgationDate ? String(law.promulgationDate) : undefined,
    enforcement_date: law.enforcementDate ? String(law.enforcementDate) : undefined,
    law_type: (law.lawType || 'Act') as LawSearchResult['law_type'],
    repeal_status: law.repealStatus === 'repealed' ? 'repealed' : 'active',
  }));
}

function parseLawDetail(
  data: unknown,
  extractArticles?: string[]
): LawDetail | null {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;
  return {
    law_id: String(d.lawId || d.law_id || ''),
    law_num: String(d.lawNum || d.law_num || ''),
    law_title: String(d.lawTitle || d.law_title || ''),
    law_type: (d.lawType || 'Act') as LawDetail['law_type'],
    promulgation_date: String(d.promulgationDate || ''),
    enforcement_date: String(d.enforcementDate || ''),
    last_updated_date: d.lastUpdatedDate ? String(d.lastUpdatedDate) : undefined,
    content: {
      preamble: d.preamble ? String(d.preamble) : undefined,
      articles: [], // Would parse from XML content
      supplementary_provisions: [],
    },
  };
}

function getFallbackLaws(keywords: string[]): LawSearchResult[] {
  // Return common laws as fallback when API is unavailable
  const commonLaws: LawSearchResult[] = [
    {
      law_id: 'fallback_labor',
      law_num: '昭和二十二年法律第四十九号',
      law_title: '労働基準法',
      law_type: 'Act',
      repeal_status: 'active',
    },
    {
      law_id: 'fallback_income_tax',
      law_num: '昭和四十年法律第三十三号',
      law_title: '所得税法',
      law_type: 'Act',
      repeal_status: 'active',
    },
    {
      law_id: 'fallback_pension',
      law_num: '昭和二十九年法律第百十五号',
      law_title: '厚生年金保険法',
      law_type: 'Act',
      repeal_status: 'active',
    },
  ];

  // Filter by keywords if provided
  if (keywords.length === 0) return commonLaws;

  return commonLaws.filter(law =>
    keywords.some(kw => law.law_title.includes(kw))
  );
}

function getEventRelatedLaws(event: PlannedEvent): string[] {
  const eventLawsMap: Record<string, string[]> = {
    SIDE_BUSINESS: ['所得税法', '個人事業税', '消費税法', '青色申告制度'],
    JOB_CHANGE: ['労働基準法', '雇用保険法', '厚生年金保険法'],
    RETIREMENT: ['厚生年金保険法', '確定拠出年金法', '退職所得控除'],
    HOME_PURCHASE: ['住宅ローン控除', '不動産取得税', '登録免許税'],
    HOME_RENOVATION: ['住宅ローン控除', '固定資産税減額', 'バリアフリー改修減税'],
    MARRIAGE: ['配偶者控除', '配偶者特別控除', '社会保険の被扶養者'],
    CHILDBIRTH: ['育児休業法', '出産手当金', '児童手当法', '医療費控除'],
    CHILD_EDUCATION: ['教育費控除', '奨学金制度', '高等教育無償化'],
    INHERITANCE: ['相続税法', '贈与税', '生命保険の非課税枠'],
    NURSING_CARE: ['介護保険法', '介護休業法', '医療費控除'],
    RELOCATION: ['住民税', '転出届・転入届', '国民健康保険'],
    NONE: [],
  };

  return eventLawsMap[event] || [];
}

function getResidenceRelatedLaws(residenceType: ResidenceType): string[] {
  const residenceLawsMap: Record<string, string[]> = {
    RENTAL: ['借地借家法', '住宅手当', '家賃補助制度'],
    OWNED: ['住宅ローン控除', '固定資産税', '住宅取得等資金贈与'],
    PARENTS_HOME: ['同居特例', '小規模宅地等の特例'],
    COMPANY_HOUSING: ['給与所得の計算', '社宅の現物給与'],
    PUBLIC_HOUSING: ['公営住宅法', '住宅セーフティネット法'],
    OTHER: [],
  };

  return residenceLawsMap[residenceType] || [];
}

function getEmploymentRelevanceReason(employmentType: EmploymentType): string {
  const reasons: Record<string, string> = {
    FULL_TIME_EMPLOYEE: 'あなたの雇用形態（正社員）に適用される法律です',
    CONTRACT_EMPLOYEE: 'あなたの雇用形態（契約・派遣社員）に適用される法律です',
    CIVIL_SERVANT: 'あなたの雇用形態（公務員）に適用される法律です',
    SELF_EMPLOYED: 'あなたの事業形態（自営業）に関連する法律です',
    PART_TIME: 'あなたの雇用形態（パート・アルバイト）に適用される法律です',
    STUDENT: '学生の方に関連する法律です',
    HOMEMAKER: '専業主婦・主夫の方に関連する法律です',
    RETIRED: '退職者・年金受給者の方に関連する法律です',
    UNEMPLOYED: '求職中の方に関連する法律です',
    OTHER: '一般的に適用される法律です',
  };

  return reasons[employmentType] || '一般的に適用される法律です';
}

function getEventRelevanceReason(event: PlannedEvent): string {
  const reasons: Record<string, string> = {
    SIDE_BUSINESS: 'あなたの計画（副業開始）に関連する法律です',
    JOB_CHANGE: 'あなたの計画（転職）に関連する法律です',
    RETIREMENT: 'あなたの計画（退職）に関連する法律です',
    HOME_PURCHASE: 'あなたの計画（住宅購入）に関連する法律です',
    HOME_RENOVATION: 'あなたの計画（リフォーム）に関連する法律です',
    MARRIAGE: 'あなたの計画（結婚）に関連する法律です',
    CHILDBIRTH: 'あなたの計画（出産）に関連する法律です',
    CHILD_EDUCATION: 'あなたの計画（子供の教育）に関連する法律です',
    INHERITANCE: 'あなたの計画（相続）に関連する法律です',
    NURSING_CARE: 'あなたの計画（介護）に関連する法律です',
    RELOCATION: 'あなたの計画（引っ越し）に関連する法律です',
    NONE: '一般的に役立つ法律です',
  };

  return reasons[event] || '一般的に役立つ法律です';
}

function getResidenceRelevanceReason(residenceType: ResidenceType): string {
  const reasons: Record<string, string> = {
    RENTAL: 'あなたの住居形態（賃貸）に関連する法律です',
    OWNED: 'あなたの住居形態（持ち家）に関連する法律です',
    PARENTS_HOME: 'あなたの住居形態（実家）に関連する法律です',
    COMPANY_HOUSING: 'あなたの住居形態（社宅）に関連する法律です',
    PUBLIC_HOUSING: 'あなたの住居形態（公営住宅）に関連する法律です',
    OTHER: '一般的な住宅関連法律です',
  };

  return reasons[residenceType] || '一般的な住宅関連法律です';
}

function getEmploymentCategory(lawTitle: string): LawCategory {
  if (lawTitle.includes('労働') || lawTitle.includes('雇用')) return 'labor';
  if (lawTitle.includes('年金')) return 'pension';
  if (lawTitle.includes('保険')) return 'insurance';
  if (lawTitle.includes('税')) return 'tax';
  return 'labor';
}

function getLawSummary(lawTitle: string): string {
  const summaries: Record<string, string> = {
    '労働基準法': '労働条件の最低基準を定めた法律。労働時間、休日、賃金などを規定。',
    '厚生年金保険法': '会社員などが加入する年金制度について定めた法律。',
    '雇用保険法': '失業時の給付や育児・介護休業給付について定めた法律。',
    '所得税法': '個人の所得に対する税金について定めた法律。各種控除も規定。',
    '国民健康保険法': '自営業者などが加入する医療保険について定めた法律。',
    '国民年金法': '日本に住む20歳以上の全員が加入する基礎年金について定めた法律。',
    '介護保険法': '高齢者の介護サービスについて定めた法律。40歳以上が対象。',
    '育児休業法': '育児休業、介護休業、看護休暇について定めた法律。',
    '相続税法': '相続や贈与に対する税金について定めた法律。',
    '借地借家法': '賃貸借契約について借主を保護するための法律。',
  };

  return summaries[lawTitle] || `${lawTitle}の詳細については、専門家にご相談ください。`;
}

/**
 * Get search guidance for users
 */
export function getSearchGuidance(): string[] {
  return [
    '法律名は正式名称で検索すると精度が上がります（例：「労働基準法」）',
    '略称や通称では検索できない場合があります',
    '関連キーワードで検索する場合は複数の言い方を試してください',
    '改正日付を指定すると、特定時点の法律を参照できます',
  ];
}

/**
 * Get personalized law search keywords based on user profile
 * Uses the term dictionary to generate relevant search terms
 */
export function getPersonalizedKeywords(userProfile: {
  employmentType?: string;
  residenceType?: string;
  householdType?: string;
  plannedEvents?: string[];
  age?: number;
}): { keywords: string[]; ageCategory?: { category: string; laws: string[] }[] } {
  // Get keywords from user attributes
  const keywords = getKeywordsForUserAttributes({
    employmentType: userProfile.employmentType,
    residenceType: userProfile.residenceType,
    householdType: userProfile.householdType,
    plannedEvents: userProfile.plannedEvents,
    age: userProfile.age,
  });

  // Get age-specific law categories
  let ageCategory: { category: string; laws: string[] }[] | undefined;
  if (userProfile.age !== undefined) {
    ageCategory = getAgeCategory(userProfile.age);
  }

  return { keywords, ageCategory };
}

/**
 * Smart search that combines keyword translation and user context
 */
export async function smartLawSearch(
  query: string,
  userContext?: {
    employmentType?: string;
    age?: number;
    plannedEvents?: string[];
  }
): Promise<{
  results: LawSearchResult[];
  expandedTerms: string[];
  recommendations: string[];
}> {
  // Translate query to legal terms
  const legalTerms = translateToLegalTerms(query);
  const expandedTerms = Array.from(new Set([query, ...legalTerms]));

  // Get user context keywords
  let contextKeywords: string[] = [];
  if (userContext) {
    const { keywords } = getPersonalizedKeywords({
      employmentType: userContext.employmentType,
      age: userContext.age,
      plannedEvents: userContext.plannedEvents,
    });
    contextKeywords = keywords.slice(0, 3); // Limit context keywords
  }

  // Search with expanded terms
  const results = await searchLawsByKeyword(expandedTerms, { limit: 10 });

  // Generate recommendations based on context
  const recommendations: string[] = [];
  if (userContext?.employmentType) {
    recommendations.push(`${userContext.employmentType}に関連する法律をさらに検索`);
  }
  if (legalTerms.length > 1) {
    recommendations.push(`「${legalTerms[0]}」で追加検索`);
  }

  return {
    results,
    expandedTerms,
    recommendations,
  };
}

/**
 * Get laws by age category
 * Returns laws relevant to specific age groups (児童、未成年、高齢者 etc.)
 */
export function getLawsByAgeCategory(age: number): {
  categories: { category: string; laws: string[] }[];
  summary: string;
} {
  const categories = getAgeCategory(age);

  let summary = '';
  if (age < 18) {
    summary = '未成年者として、労働基準法による保護や民法上の制限があります。';
  } else if (age >= 65) {
    summary = '高齢者として、介護保険法や高齢者雇用安定法の適用があります。';
  } else {
    summary = '成年として、一般的な法律が適用されます。';
  }

  return { categories, summary };
}
