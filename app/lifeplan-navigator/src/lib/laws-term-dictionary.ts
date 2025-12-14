/**
 * 法令API用 表記揺れ対応辞書
 * 一般用語から法令用語への変換マッピング
 */

// 表記揺れ辞書：一般用語 → 法令で使用される用語（配列）
export const TERM_DICTIONARY: Record<string, string[]> = {
  // 交通・車両関連
  'シートベルト': ['座席ベルト', '安全ベルト'],
  'チャイルドシート': ['幼児用補助装置', '乳児用補助装置'],
  '車': ['自動車', '車両', '軽車両'],
  'バイク': ['自動二輪車', '原動機付自転車', '二輪自動車'],
  '自転車': ['自転車', '軽車両'],
  '免許': ['運転免許', '運転免許証'],
  '飲酒運転': ['酒気帯び運転', '酒酔い運転'],

  // 年齢・人物関連
  '子供': ['児童', '幼児', '乳児', '少年', '未成年者'],
  '赤ちゃん': ['乳児', '乳幼児'],
  '幼児': ['幼児'],  // 6歳未満（児童福祉法）
  '児童': ['児童', '学童'],  // 18歳未満（児童福祉法）
  '未成年': ['未成年者', '年少者'],  // 18歳未満（民法）
  'お年寄り': ['高齢者', '老人', '老齢者'],
  '障害者': ['障害者', '身体障害者', '知的障害者', '精神障害者'],

  // 雇用・労働関連
  '会社': ['事業者', '使用者', '事業主'],
  '社員': ['労働者', '従業員', '被用者'],
  'パート': ['短時間労働者', 'パートタイム労働者'],
  'アルバイト': ['短時間労働者', '有期雇用労働者'],
  '派遣': ['派遣労働者', '派遣労働'],
  'クビ': ['解雇', '雇止め'],
  '残業': ['時間外労働', '時間外勤務'],
  '有給': ['年次有給休暇', '有給休暇'],
  '育休': ['育児休業', '育児休暇'],
  '産休': ['産前産後休業', '産前休暇', '産後休暇'],

  // 税金・お金関連
  '税金': ['租税', '税', '国税', '地方税'],
  '所得税': ['所得税'],
  '住民税': ['地方税', '住民税', '市町村民税', '道府県民税'],
  '消費税': ['消費税'],
  '控除': ['控除', '所得控除', '税額控除'],
  '確定申告': ['確定申告', '申告納税'],
  '年末調整': ['年末調整'],
  '相続': ['相続', '遺産'],
  '贈与': ['贈与'],

  // 社会保険関連
  '健康保険': ['健康保険', '医療保険'],
  '年金': ['年金', '厚生年金', '国民年金'],
  '失業保険': ['雇用保険', '失業等給付'],
  '労災': ['労働者災害補償保険', '労災保険'],
  '介護保険': ['介護保険'],
  '生活保護': ['生活保護', '被保護者'],

  // 住宅・不動産関連
  '家': ['住宅', '建築物', '建物'],
  'マンション': ['共同住宅', '集合住宅', '区分所有建物'],
  'アパート': ['共同住宅', '賃貸住宅'],
  '賃貸': ['賃貸借', '借家', '借地'],
  '敷金': ['敷金', '保証金'],
  '礼金': ['権利金'],
  'ローン': ['住宅ローン', '借入金', '貸付金'],

  // 家族関連
  '結婚': ['婚姻', '結婚'],
  '離婚': ['離婚'],
  '養子': ['養子', '養子縁組'],
  '親権': ['親権'],
  '扶養': ['扶養', '扶養義務'],
  '遺言': ['遺言', '遺言書'],

  // 手続き・届出関連
  '届出': ['届出', '届け出', '届'],
  '申請': ['申請', '請求'],
  '届け': ['届', '届出'],
  'パスポート': ['旅券'],
  '住民票': ['住民票', '住民基本台帳'],
  '戸籍': ['戸籍'],
  'マイナンバー': ['個人番号', '番号法'],
};

// ユーザー属性から法令検索キーワードへのマッピング
export const USER_ATTRIBUTE_KEYWORDS: Record<string, string[]> = {
  // 雇用形態
  'FULL_TIME': ['労働基準法', '年次有給休暇', '残業', '社会保険', '厚生年金'],
  'PART_TIME': ['短時間労働者', 'パートタイム労働法', '社会保険適用拡大'],
  'SELF_EMPLOYED': ['確定申告', '青色申告', '個人事業', '事業所得', '国民年金'],
  'FREELANCE': ['確定申告', 'フリーランス', '請負契約', '委託契約'],
  'UNEMPLOYED': ['失業給付', '雇用保険', '求職者給付', '国民健康保険'],
  'STUDENT': ['学生納付特例', '国民年金', '奨学金'],
  'RETIRED': ['年金受給', '老齢年金', '後期高齢者医療'],

  // 住居形態
  'RENT': ['借地借家法', '敷金', '原状回復', '賃貸借契約'],
  'OWN': ['住宅ローン控除', '固定資産税', '不動産取得税'],
  'PARENTS_HOME': ['扶養控除', '世帯'],
  'COMPANY_HOUSING': ['社宅', '給与所得', '現物給与'],

  // 世帯構成
  'SINGLE': ['一人暮らし', '国民健康保険', '国民年金'],
  'COUPLE': ['配偶者控除', '配偶者特別控除', '扶養'],
  'FAMILY_WITH_CHILDREN': ['児童手当', '育児休業', '保育', '扶養控除'],
  'SINGLE_PARENT': ['ひとり親', 'ひとり親控除', '児童扶養手当'],
  'WITH_PARENTS': ['扶養控除', '介護休業', '介護保険'],

  // ライフイベント
  'SIDE_JOB': ['副業', '兼業', '雑所得', '確定申告'],
  'JOB_CHANGE': ['失業給付', '雇用保険', '離職票', '国民年金切替'],
  'HOUSE_PURCHASE': ['住宅ローン控除', '不動産取得税', '登録免許税', '住宅取得'],
  'MARRIAGE': ['婚姻届', '氏の変更', '扶養控除', '配偶者控除'],
  'CHILDBIRTH': ['出産育児一時金', '育児休業給付', '児童手当', '産前産後休業'],
  'INHERITANCE': ['相続税', '遺産分割', '相続放棄', '遺言'],
  'RETIREMENT': ['退職金', '退職所得控除', '年金受給', '確定申告'],
};

// 年齢区分定義
export const AGE_CATEGORIES: Record<string, { minAge: number; maxAge: number; laws: string[] }> = {
  '乳児': { minAge: 0, maxAge: 0, laws: ['児童福祉法'] },
  '幼児': { minAge: 1, maxAge: 5, laws: ['児童福祉法', '学校教育法'] },
  '児童': { minAge: 6, maxAge: 17, laws: ['児童福祉法', '労働基準法'] },
  '未成年者': { minAge: 0, maxAge: 17, laws: ['民法'] },
  '成年': { minAge: 18, maxAge: 999, laws: ['民法'] },
  '年少者': { minAge: 0, maxAge: 17, laws: ['労働基準法'] },
  '高齢者': { minAge: 65, maxAge: 999, laws: ['高齢者雇用安定法', '介護保険法'] },
  '後期高齢者': { minAge: 75, maxAge: 999, laws: ['高齢者医療確保法'] },
};

/**
 * 一般用語を法令用語に変換
 */
export function translateToLegalTerms(generalTerm: string): string[] {
  // 完全一致を検索
  if (TERM_DICTIONARY[generalTerm]) {
    return TERM_DICTIONARY[generalTerm];
  }

  // 部分一致を検索
  const results: string[] = [];
  for (const [key, values] of Object.entries(TERM_DICTIONARY)) {
    if (generalTerm.includes(key) || key.includes(generalTerm)) {
      results.push(...values);
    }
  }

  // 見つからない場合は元の用語を返す
  return results.length > 0 ? Array.from(new Set(results)) : [generalTerm];
}

/**
 * ユーザー属性から検索キーワードを生成
 */
export function getKeywordsForUserAttributes(attributes: {
  employmentType?: string;
  residenceType?: string;
  householdType?: string;
  plannedEvents?: string[];
  age?: number;
}): string[] {
  const keywords: string[] = [];

  // 雇用形態
  if (attributes.employmentType && USER_ATTRIBUTE_KEYWORDS[attributes.employmentType]) {
    keywords.push(...USER_ATTRIBUTE_KEYWORDS[attributes.employmentType]);
  }

  // 住居形態
  if (attributes.residenceType && USER_ATTRIBUTE_KEYWORDS[attributes.residenceType]) {
    keywords.push(...USER_ATTRIBUTE_KEYWORDS[attributes.residenceType]);
  }

  // 世帯構成
  if (attributes.householdType && USER_ATTRIBUTE_KEYWORDS[attributes.householdType]) {
    keywords.push(...USER_ATTRIBUTE_KEYWORDS[attributes.householdType]);
  }

  // ライフイベント
  if (attributes.plannedEvents) {
    for (const event of attributes.plannedEvents) {
      if (USER_ATTRIBUTE_KEYWORDS[event]) {
        keywords.push(...USER_ATTRIBUTE_KEYWORDS[event]);
      }
    }
  }

  // 年齢による追加キーワード
  if (attributes.age !== undefined) {
    if (attributes.age >= 60 && attributes.age < 65) {
      keywords.push('高年齢者', '継続雇用', '定年');
    } else if (attributes.age >= 65) {
      keywords.push('高齢者', '年金受給', '介護保険');
    }
    if (attributes.age >= 75) {
      keywords.push('後期高齢者医療');
    }
  }

  // 重複を除去
  return Array.from(new Set(keywords));
}

/**
 * 年齢から該当する年齢区分を取得
 */
export function getAgeCategory(age: number): { category: string; laws: string[] }[] {
  const results: { category: string; laws: string[] }[] = [];

  for (const [category, info] of Object.entries(AGE_CATEGORIES)) {
    if (age >= info.minAge && age <= info.maxAge) {
      results.push({ category, laws: info.laws });
    }
  }

  return results;
}

export default {
  TERM_DICTIONARY,
  USER_ATTRIBUTE_KEYWORDS,
  AGE_CATEGORIES,
  translateToLegalTerms,
  getKeywordsForUserAttributes,
  getAgeCategory,
};
