import { describe, it, expect } from 'vitest';
import {
  TERM_DICTIONARY,
  USER_ATTRIBUTE_KEYWORDS,
  AGE_CATEGORIES,
  translateToLegalTerms,
  getKeywordsForUserAttributes,
  getAgeCategory,
} from '../laws-term-dictionary';

describe('TERM_DICTIONARY', () => {
  it('contains traffic/vehicle related terms', () => {
    expect(TERM_DICTIONARY['シートベルト']).toContain('座席ベルト');
    expect(TERM_DICTIONARY['チャイルドシート']).toContain('幼児用補助装置');
    expect(TERM_DICTIONARY['車']).toContain('自動車');
    expect(TERM_DICTIONARY['バイク']).toContain('自動二輪車');
  });

  it('contains age/person related terms', () => {
    expect(TERM_DICTIONARY['子供']).toContain('児童');
    expect(TERM_DICTIONARY['赤ちゃん']).toContain('乳児');
    expect(TERM_DICTIONARY['お年寄り']).toContain('高齢者');
    expect(TERM_DICTIONARY['未成年']).toContain('未成年者');
  });

  it('contains employment related terms', () => {
    expect(TERM_DICTIONARY['会社']).toContain('事業者');
    expect(TERM_DICTIONARY['社員']).toContain('労働者');
    expect(TERM_DICTIONARY['パート']).toContain('短時間労働者');
    expect(TERM_DICTIONARY['残業']).toContain('時間外労働');
    expect(TERM_DICTIONARY['有給']).toContain('年次有給休暇');
  });

  it('contains tax related terms', () => {
    expect(TERM_DICTIONARY['税金']).toContain('租税');
    expect(TERM_DICTIONARY['控除']).toContain('所得控除');
    expect(TERM_DICTIONARY['確定申告']).toContain('申告納税');
  });

  it('contains social insurance related terms', () => {
    expect(TERM_DICTIONARY['年金']).toContain('厚生年金');
    expect(TERM_DICTIONARY['失業保険']).toContain('雇用保険');
    expect(TERM_DICTIONARY['労災']).toContain('労働者災害補償保険');
  });

  it('contains housing related terms', () => {
    expect(TERM_DICTIONARY['家']).toContain('住宅');
    expect(TERM_DICTIONARY['マンション']).toContain('共同住宅');
    expect(TERM_DICTIONARY['敷金']).toContain('敷金');
    expect(TERM_DICTIONARY['ローン']).toContain('住宅ローン');
  });

  it('contains family related terms', () => {
    expect(TERM_DICTIONARY['結婚']).toContain('婚姻');
    expect(TERM_DICTIONARY['離婚']).toContain('離婚');
    expect(TERM_DICTIONARY['養子']).toContain('養子縁組');
    expect(TERM_DICTIONARY['遺言']).toContain('遺言書');
  });

  it('contains procedure related terms', () => {
    expect(TERM_DICTIONARY['届出']).toContain('届け出');
    expect(TERM_DICTIONARY['パスポート']).toContain('旅券');
    expect(TERM_DICTIONARY['マイナンバー']).toContain('個人番号');
  });
});

describe('USER_ATTRIBUTE_KEYWORDS', () => {
  it('contains keywords for employment types', () => {
    expect(USER_ATTRIBUTE_KEYWORDS['FULL_TIME']).toContain('労働基準法');
    expect(USER_ATTRIBUTE_KEYWORDS['PART_TIME']).toContain('短時間労働者');
    expect(USER_ATTRIBUTE_KEYWORDS['SELF_EMPLOYED']).toContain('確定申告');
    expect(USER_ATTRIBUTE_KEYWORDS['UNEMPLOYED']).toContain('失業給付');
    expect(USER_ATTRIBUTE_KEYWORDS['STUDENT']).toContain('学生納付特例');
    expect(USER_ATTRIBUTE_KEYWORDS['RETIRED']).toContain('年金受給');
  });

  it('contains keywords for residence types', () => {
    expect(USER_ATTRIBUTE_KEYWORDS['RENT']).toContain('借地借家法');
    expect(USER_ATTRIBUTE_KEYWORDS['OWN']).toContain('住宅ローン控除');
    expect(USER_ATTRIBUTE_KEYWORDS['PARENTS_HOME']).toContain('扶養控除');
    expect(USER_ATTRIBUTE_KEYWORDS['COMPANY_HOUSING']).toContain('社宅');
  });

  it('contains keywords for household types', () => {
    expect(USER_ATTRIBUTE_KEYWORDS['SINGLE']).toContain('国民健康保険');
    expect(USER_ATTRIBUTE_KEYWORDS['COUPLE']).toContain('配偶者控除');
    expect(USER_ATTRIBUTE_KEYWORDS['FAMILY_WITH_CHILDREN']).toContain('児童手当');
    expect(USER_ATTRIBUTE_KEYWORDS['SINGLE_PARENT']).toContain('ひとり親控除');
    expect(USER_ATTRIBUTE_KEYWORDS['WITH_PARENTS']).toContain('介護休業');
  });

  it('contains keywords for life events', () => {
    expect(USER_ATTRIBUTE_KEYWORDS['SIDE_JOB']).toContain('副業');
    expect(USER_ATTRIBUTE_KEYWORDS['JOB_CHANGE']).toContain('失業給付');
    expect(USER_ATTRIBUTE_KEYWORDS['HOUSE_PURCHASE']).toContain('住宅ローン控除');
    expect(USER_ATTRIBUTE_KEYWORDS['MARRIAGE']).toContain('婚姻届');
    expect(USER_ATTRIBUTE_KEYWORDS['CHILDBIRTH']).toContain('出産育児一時金');
    expect(USER_ATTRIBUTE_KEYWORDS['INHERITANCE']).toContain('相続税');
    expect(USER_ATTRIBUTE_KEYWORDS['RETIREMENT']).toContain('退職金');
  });
});

describe('AGE_CATEGORIES', () => {
  it('defines age ranges correctly', () => {
    expect(AGE_CATEGORIES['乳児'].minAge).toBe(0);
    expect(AGE_CATEGORIES['乳児'].maxAge).toBe(0);

    expect(AGE_CATEGORIES['幼児'].minAge).toBe(1);
    expect(AGE_CATEGORIES['幼児'].maxAge).toBe(5);

    expect(AGE_CATEGORIES['児童'].minAge).toBe(6);
    expect(AGE_CATEGORIES['児童'].maxAge).toBe(17);

    expect(AGE_CATEGORIES['未成年者'].minAge).toBe(0);
    expect(AGE_CATEGORIES['未成年者'].maxAge).toBe(17);

    expect(AGE_CATEGORIES['成年'].minAge).toBe(18);

    expect(AGE_CATEGORIES['高齢者'].minAge).toBe(65);

    expect(AGE_CATEGORIES['後期高齢者'].minAge).toBe(75);
  });

  it('associates laws with each category', () => {
    expect(AGE_CATEGORIES['児童'].laws).toContain('児童福祉法');
    expect(AGE_CATEGORIES['未成年者'].laws).toContain('民法');
    expect(AGE_CATEGORIES['高齢者'].laws).toContain('介護保険法');
    expect(AGE_CATEGORIES['後期高齢者'].laws).toContain('高齢者医療確保法');
  });
});

describe('translateToLegalTerms', () => {
  it('returns exact match translations', () => {
    const result = translateToLegalTerms('シートベルト');
    expect(result).toContain('座席ベルト');
    expect(result).toContain('安全ベルト');
  });

  it('returns partial match translations', () => {
    const result = translateToLegalTerms('残業時間');
    expect(result).toContain('時間外労働');
  });

  it('returns original term when no match found', () => {
    const result = translateToLegalTerms('xyz123');
    expect(result).toEqual(['xyz123']);
  });

  it('removes duplicates from results', () => {
    const result = translateToLegalTerms('子供');
    const uniqueResult = new Set(result);
    expect(result.length).toBe(uniqueResult.size);
  });

  it('handles empty string', () => {
    const result = translateToLegalTerms('');
    // Empty string matches all keys due to partial matching (key.includes(''))
    // Returns all terms from dictionary
    expect(result.length).toBeGreaterThan(0);
  });

  it('translates common terms correctly', () => {
    expect(translateToLegalTerms('クビ')).toContain('解雇');
    expect(translateToLegalTerms('育休')).toContain('育児休業');
    expect(translateToLegalTerms('産休')).toContain('産前産後休業');
  });
});

describe('getKeywordsForUserAttributes', () => {
  it('returns keywords for employment type', () => {
    const result = getKeywordsForUserAttributes({
      employmentType: 'FULL_TIME',
    });
    expect(result).toContain('労働基準法');
    expect(result).toContain('年次有給休暇');
  });

  it('returns keywords for residence type', () => {
    const result = getKeywordsForUserAttributes({
      residenceType: 'RENT',
    });
    expect(result).toContain('借地借家法');
    expect(result).toContain('敷金');
  });

  it('returns keywords for household type', () => {
    const result = getKeywordsForUserAttributes({
      householdType: 'FAMILY_WITH_CHILDREN',
    });
    expect(result).toContain('児童手当');
    expect(result).toContain('扶養控除');
  });

  it('returns keywords for planned events', () => {
    const result = getKeywordsForUserAttributes({
      plannedEvents: ['HOUSE_PURCHASE', 'MARRIAGE'],
    });
    expect(result).toContain('住宅ローン控除');
    expect(result).toContain('婚姻届');
  });

  it('returns keywords for age 60-64', () => {
    const result = getKeywordsForUserAttributes({
      age: 62,
    });
    expect(result).toContain('高年齢者');
    expect(result).toContain('継続雇用');
    expect(result).toContain('定年');
  });

  it('returns keywords for age 65+', () => {
    const result = getKeywordsForUserAttributes({
      age: 70,
    });
    expect(result).toContain('高齢者');
    expect(result).toContain('年金受給');
    expect(result).toContain('介護保険');
  });

  it('returns keywords for age 75+', () => {
    const result = getKeywordsForUserAttributes({
      age: 80,
    });
    expect(result).toContain('後期高齢者医療');
  });

  it('combines multiple attributes', () => {
    const result = getKeywordsForUserAttributes({
      employmentType: 'FULL_TIME',
      residenceType: 'OWN',
      householdType: 'COUPLE',
      plannedEvents: ['CHILDBIRTH'],
      age: 35,
    });
    expect(result).toContain('労働基準法');
    expect(result).toContain('住宅ローン控除');
    expect(result).toContain('配偶者控除');
    expect(result).toContain('出産育児一時金');
  });

  it('removes duplicate keywords', () => {
    const result = getKeywordsForUserAttributes({
      employmentType: 'FULL_TIME',
      residenceType: 'OWN',
    });
    const uniqueResult = new Set(result);
    expect(result.length).toBe(uniqueResult.size);
  });

  it('returns empty array for empty attributes', () => {
    const result = getKeywordsForUserAttributes({});
    expect(result).toEqual([]);
  });

  it('handles unknown attribute values gracefully', () => {
    const result = getKeywordsForUserAttributes({
      employmentType: 'UNKNOWN_TYPE',
      residenceType: 'UNKNOWN_TYPE',
    });
    expect(result).toEqual([]);
  });
});

describe('getAgeCategory', () => {
  it('returns correct category for infant (0 years)', () => {
    const result = getAgeCategory(0);
    const categories = result.map(r => r.category);
    expect(categories).toContain('乳児');
    expect(categories).toContain('未成年者');
  });

  it('returns correct category for toddler (3 years)', () => {
    const result = getAgeCategory(3);
    const categories = result.map(r => r.category);
    expect(categories).toContain('幼児');
    expect(categories).toContain('未成年者');
  });

  it('returns correct category for child (10 years)', () => {
    const result = getAgeCategory(10);
    const categories = result.map(r => r.category);
    expect(categories).toContain('児童');
    expect(categories).toContain('未成年者');
    expect(categories).toContain('年少者');
  });

  it('returns correct category for adult (30 years)', () => {
    const result = getAgeCategory(30);
    const categories = result.map(r => r.category);
    expect(categories).toContain('成年');
    expect(categories).not.toContain('未成年者');
  });

  it('returns correct category for senior (70 years)', () => {
    const result = getAgeCategory(70);
    const categories = result.map(r => r.category);
    expect(categories).toContain('成年');
    expect(categories).toContain('高齢者');
  });

  it('returns correct category for late elderly (80 years)', () => {
    const result = getAgeCategory(80);
    const categories = result.map(r => r.category);
    expect(categories).toContain('成年');
    expect(categories).toContain('高齢者');
    expect(categories).toContain('後期高齢者');
  });

  it('returns associated laws for each category', () => {
    const result = getAgeCategory(16);
    const childCategory = result.find(r => r.category === '児童');
    expect(childCategory).toBeDefined();
    expect(childCategory?.laws).toContain('児童福祉法');
  });

  it('returns empty array for negative age', () => {
    const result = getAgeCategory(-1);
    expect(result).toEqual([]);
  });
});
