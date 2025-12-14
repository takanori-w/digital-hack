/**
 * Laws API Types
 * Based on: e-Gov Laws API v2 (https://laws.e-gov.go.jp/api/2)
 */

// Law type classification
export type LawType =
  | 'Constitution'      // 憲法
  | 'Act'              // 法律
  | 'CabinetOrder'     // 政令
  | 'ImperialOrder'    // 勅令
  | 'MinisterialOrdinance' // 府省令
  | 'Rule'             // 規則
  | 'Misc';            // その他

export const LawTypeLabels: Record<LawType, string> = {
  Constitution: '憲法',
  Act: '法律',
  CabinetOrder: '政令',
  ImperialOrder: '勅令',
  MinisterialOrdinance: '府省令',
  Rule: '規則',
  Misc: 'その他',
};

// Law search result from API
export interface LawSearchResult {
  law_id: string;
  law_num: string;         // 法令番号
  law_title: string;       // 法令名
  law_title_kana?: string; // 法令名読み
  law_title_en?: string;   // 法令名英語
  promulgation_date?: string; // 公布日
  enforcement_date?: string;  // 施行日
  law_type: LawType;
  repeal_status?: 'active' | 'repealed'; // 廃止状況
}

// Detailed law content
export interface LawDetail {
  law_id: string;
  law_num: string;
  law_title: string;
  law_type: LawType;
  promulgation_date: string;
  enforcement_date: string;
  last_updated_date?: string;
  content: LawContent;
  related_laws?: RelatedLaw[];
}

export interface LawContent {
  preamble?: string;      // 前文
  articles: LawArticle[];
  supplementary_provisions?: SupplementaryProvision[];
}

export interface LawArticle {
  article_num: string;    // 条番号
  article_title?: string; // 見出し
  paragraphs: LawParagraph[];
}

export interface LawParagraph {
  paragraph_num: number;
  text: string;
  items?: LawItem[];
}

export interface LawItem {
  item_num: string;
  text: string;
  sub_items?: LawSubItem[];
}

export interface LawSubItem {
  sub_item_num: string;
  text: string;
}

export interface SupplementaryProvision {
  title: string;
  articles: LawArticle[];
}

export interface RelatedLaw {
  law_id: string;
  law_title: string;
  relation_type: 'amendment' | 'reference' | 'parent' | 'child';
}

// API response types
export interface LawsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total_count: number;
    offset: number;
    limit: number;
  };
}

export interface LawSearchResponse {
  results: LawSearchResult[];
  total_count: number;
}

// Search parameters
export interface LawSearchParams {
  keywords?: string[];
  title_keywords?: string[];
  law_type?: LawType[];
  date_from?: string;
  date_to?: string;
  include_repealed?: boolean;
  limit?: number;
  offset?: number;
}

// User profile to laws mapping
export interface LawRecommendation {
  law_id: string;
  law_title: string;
  law_num: string;
  relevance_reason: string;
  relevance_score: number;
  category: LawCategory;
  summary?: string;
  key_articles?: string[];
}

export type LawCategory =
  | 'tax'           // 税金関連
  | 'labor'         // 労働関連
  | 'social_security' // 社会保障
  | 'housing'       // 住宅関連
  | 'family'        // 家族関連
  | 'inheritance'   // 相続関連
  | 'pension'       // 年金関連
  | 'insurance'     // 保険関連
  | 'business'      // 事業関連
  | 'education'     // 教育関連
  | 'other';        // その他

export const LawCategoryLabels: Record<LawCategory, string> = {
  tax: '税金',
  labor: '労働',
  social_security: '社会保障',
  housing: '住宅',
  family: '家族',
  inheritance: '相続',
  pension: '年金',
  insurance: '保険',
  business: '事業',
  education: '教育',
  other: 'その他',
};

// Mapping from user events to law categories
export const PlannedEventToLawCategory: Record<string, LawCategory[]> = {
  SIDE_BUSINESS: ['tax', 'labor', 'business'],
  JOB_CHANGE: ['labor', 'tax', 'social_security'],
  RETIREMENT: ['pension', 'tax', 'social_security'],
  HOME_PURCHASE: ['housing', 'tax'],
  HOME_RENOVATION: ['housing', 'tax'],
  MARRIAGE: ['family', 'tax'],
  CHILDBIRTH: ['family', 'social_security', 'labor'],
  CHILD_EDUCATION: ['education', 'tax'],
  INHERITANCE: ['inheritance', 'tax'],
  NURSING_CARE: ['social_security', 'family'],
  RELOCATION: ['housing', 'tax'],
};

// Mapping from employment type to relevant laws
export const EmploymentTypeToLaws: Record<string, string[]> = {
  FULL_TIME_EMPLOYEE: ['労働基準法', '厚生年金保険法', '雇用保険法'],
  CONTRACT_EMPLOYEE: ['労働基準法', '労働契約法', '厚生年金保険法'],
  CIVIL_SERVANT: ['国家公務員法', '地方公務員法', '国家公務員共済組合法'],
  SELF_EMPLOYED: ['所得税法', '国民健康保険法', '国民年金法'],
  PART_TIME: ['パートタイム労働法', '最低賃金法', '労働基準法'],
  STUDENT: ['学校教育法', '国民年金法'],
  HOMEMAKER: ['国民健康保険法', '国民年金法'],
  RETIRED: ['高齢者医療確保法', '厚生年金保険法', '介護保険法'],
  UNEMPLOYED: ['雇用保険法', '国民健康保険法', '国民年金法'],
  OTHER: ['国民健康保険法', '国民年金法'],
};
