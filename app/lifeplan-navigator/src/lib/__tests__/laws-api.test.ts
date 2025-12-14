import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getLawRecommendations,
  getSearchGuidance,
  getPersonalizedKeywords,
  getLawsByAgeCategory,
} from '../laws-api';
import { EmploymentType, PlannedEvent, ResidenceType } from '@/types/onboarding';

describe('getLawRecommendations', () => {
  it('returns recommendations for employment type', () => {
    const result = getLawRecommendations(EmploymentType.FULL_TIME_EMPLOYEE);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('law_id');
    expect(result[0]).toHaveProperty('law_title');
    expect(result[0]).toHaveProperty('relevance_reason');
    expect(result[0]).toHaveProperty('relevance_score');
  });

  it('returns recommendations for planned events', () => {
    const result = getLawRecommendations(
      undefined,
      [PlannedEvent.HOME_PURCHASE, PlannedEvent.MARRIAGE]
    );
    expect(result.length).toBeGreaterThan(0);
    // Should include home purchase and marriage related laws
    const titles = result.map(r => r.law_title);
    expect(titles.some(t => t.includes('住宅') || t.includes('控除'))).toBe(true);
  });

  it('returns recommendations for residence type', () => {
    const result = getLawRecommendations(
      undefined,
      undefined,
      ResidenceType.RENTAL
    );
    expect(result.length).toBeGreaterThan(0);
    const titles = result.map(r => r.law_title);
    expect(titles.some(t => t.includes('借地借家') || t.includes('住宅'))).toBe(true);
  });

  it('combines multiple parameters', () => {
    const result = getLawRecommendations(
      EmploymentType.SELF_EMPLOYED,
      [PlannedEvent.SIDE_BUSINESS],
      ResidenceType.OWNED
    );
    expect(result.length).toBeGreaterThan(0);
    // Should include self-employed, side business, and owned home related laws
  });

  it('returns sorted results by relevance score', () => {
    const result = getLawRecommendations(
      EmploymentType.FULL_TIME_EMPLOYEE,
      [PlannedEvent.CHILDBIRTH]
    );
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].relevance_score).toBeGreaterThanOrEqual(result[i].relevance_score);
    }
  });

  it('returns empty array when no parameters provided', () => {
    const result = getLawRecommendations();
    expect(result).toEqual([]);
  });

  it('returns recommendations with valid structure', () => {
    const result = getLawRecommendations(EmploymentType.PART_TIME);
    result.forEach(rec => {
      expect(rec).toHaveProperty('law_id');
      expect(rec).toHaveProperty('law_title');
      expect(rec).toHaveProperty('law_num');
      expect(rec).toHaveProperty('relevance_reason');
      expect(rec).toHaveProperty('relevance_score');
      expect(rec).toHaveProperty('category');
      expect(rec).toHaveProperty('summary');
      expect(typeof rec.relevance_score).toBe('number');
      expect(rec.relevance_score).toBeGreaterThan(0);
      expect(rec.relevance_score).toBeLessThanOrEqual(1);
    });
  });

  it('does not duplicate laws in recommendations', () => {
    const result = getLawRecommendations(
      EmploymentType.FULL_TIME_EMPLOYEE,
      [PlannedEvent.JOB_CHANGE, PlannedEvent.RETIREMENT],
      ResidenceType.OWNED
    );
    const titles = result.map(r => r.law_title);
    const uniqueTitles = new Set(titles);
    expect(titles.length).toBe(uniqueTitles.size);
  });

  it('returns appropriate reasons for employment type', () => {
    const result = getLawRecommendations(EmploymentType.STUDENT);
    const studentRec = result.find(r => r.relevance_reason.includes('学生'));
    expect(studentRec).toBeDefined();
  });

  it('returns appropriate reasons for planned events', () => {
    const result = getLawRecommendations(undefined, [PlannedEvent.INHERITANCE]);
    const inheritanceRec = result.find(r => r.relevance_reason.includes('相続'));
    expect(inheritanceRec).toBeDefined();
  });
});

describe('getSearchGuidance', () => {
  it('returns array of guidance strings', () => {
    const result = getSearchGuidance();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns guidance about search methods', () => {
    const result = getSearchGuidance();
    const guidanceText = result.join(' ');
    expect(guidanceText).toContain('法律名');
    expect(guidanceText).toContain('検索');
  });

  it('returns non-empty strings', () => {
    const result = getSearchGuidance();
    result.forEach(guidance => {
      expect(typeof guidance).toBe('string');
      expect(guidance.length).toBeGreaterThan(0);
    });
  });
});

describe('getPersonalizedKeywords', () => {
  it('returns keywords for employment type', () => {
    const result = getPersonalizedKeywords({
      employmentType: 'FULL_TIME',
    });
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords).toContain('労働基準法');
  });

  it('returns keywords for residence type', () => {
    const result = getPersonalizedKeywords({
      residenceType: 'RENT',
    });
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords).toContain('借地借家法');
  });

  it('returns keywords for household type', () => {
    const result = getPersonalizedKeywords({
      householdType: 'FAMILY_WITH_CHILDREN',
    });
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords).toContain('児童手当');
  });

  it('returns keywords for planned events', () => {
    const result = getPersonalizedKeywords({
      plannedEvents: ['CHILDBIRTH'],
    });
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords).toContain('出産育児一時金');
  });

  it('returns age category for minors', () => {
    const result = getPersonalizedKeywords({
      age: 16,
    });
    expect(result.ageCategory).toBeDefined();
    expect(result.ageCategory?.some(c => c.category === '未成年者')).toBe(true);
  });

  it('returns age category for seniors', () => {
    const result = getPersonalizedKeywords({
      age: 70,
    });
    expect(result.ageCategory).toBeDefined();
    expect(result.ageCategory?.some(c => c.category === '高齢者')).toBe(true);
  });

  it('returns no age category when age not provided', () => {
    const result = getPersonalizedKeywords({
      employmentType: 'FULL_TIME',
    });
    expect(result.ageCategory).toBeUndefined();
  });

  it('combines multiple user attributes', () => {
    const result = getPersonalizedKeywords({
      employmentType: 'SELF_EMPLOYED',
      residenceType: 'OWN',
      householdType: 'COUPLE',
      plannedEvents: ['MARRIAGE'],
      age: 35,
    });
    expect(result.keywords.length).toBeGreaterThan(0);
    // Should include keywords from multiple sources
    expect(result.keywords).toContain('確定申告');
    expect(result.keywords).toContain('住宅ローン控除');
    expect(result.keywords).toContain('配偶者控除');
  });

  it('returns empty keywords for empty profile', () => {
    const result = getPersonalizedKeywords({});
    expect(result.keywords).toEqual([]);
  });
});

describe('getLawsByAgeCategory', () => {
  it('returns categories for minor (age 16)', () => {
    const result = getLawsByAgeCategory(16);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories.some(c => c.category === '未成年者')).toBe(true);
    expect(result.summary).toContain('未成年者');
  });

  it('returns categories for adult (age 30)', () => {
    const result = getLawsByAgeCategory(30);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories.some(c => c.category === '成年')).toBe(true);
    expect(result.summary).toContain('成年');
  });

  it('returns categories for senior (age 70)', () => {
    const result = getLawsByAgeCategory(70);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories.some(c => c.category === '高齢者')).toBe(true);
    expect(result.summary).toContain('高齢者');
  });

  it('returns categories for late elderly (age 80)', () => {
    const result = getLawsByAgeCategory(80);
    expect(result.categories.some(c => c.category === '後期高齢者')).toBe(true);
  });

  it('includes relevant laws in categories', () => {
    const result = getLawsByAgeCategory(16);
    const minorCategory = result.categories.find(c => c.category === '未成年者');
    expect(minorCategory?.laws).toContain('民法');
  });

  it('returns summary with appropriate message', () => {
    const minorResult = getLawsByAgeCategory(10);
    expect(minorResult.summary.length).toBeGreaterThan(0);

    const adultResult = getLawsByAgeCategory(30);
    expect(adultResult.summary.length).toBeGreaterThan(0);

    const seniorResult = getLawsByAgeCategory(70);
    expect(seniorResult.summary.length).toBeGreaterThan(0);
  });

  it('returns correct structure', () => {
    const result = getLawsByAgeCategory(25);
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.categories)).toBe(true);
    expect(typeof result.summary).toBe('string');
  });

  it('categories have correct structure', () => {
    const result = getLawsByAgeCategory(50);
    result.categories.forEach(cat => {
      expect(cat).toHaveProperty('category');
      expect(cat).toHaveProperty('laws');
      expect(typeof cat.category).toBe('string');
      expect(Array.isArray(cat.laws)).toBe(true);
    });
  });
});

describe('Edge Cases', () => {
  it('handles boundary age for minor/adult (17 vs 18)', () => {
    const minorResult = getLawsByAgeCategory(17);
    const adultResult = getLawsByAgeCategory(18);

    expect(minorResult.categories.some(c => c.category === '未成年者')).toBe(true);
    expect(adultResult.categories.some(c => c.category === '未成年者')).toBe(false);
    expect(adultResult.categories.some(c => c.category === '成年')).toBe(true);
  });

  it('handles boundary age for senior (64 vs 65)', () => {
    const preseniorResult = getLawsByAgeCategory(64);
    const seniorResult = getLawsByAgeCategory(65);

    expect(preseniorResult.categories.some(c => c.category === '高齢者')).toBe(false);
    expect(seniorResult.categories.some(c => c.category === '高齢者')).toBe(true);
  });

  it('handles boundary age for late elderly (74 vs 75)', () => {
    const seniorResult = getLawsByAgeCategory(74);
    const lateElderlyResult = getLawsByAgeCategory(75);

    expect(seniorResult.categories.some(c => c.category === '後期高齢者')).toBe(false);
    expect(lateElderlyResult.categories.some(c => c.category === '後期高齢者')).toBe(true);
  });

  it('handles very old age (100+)', () => {
    const result = getLawsByAgeCategory(100);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories.some(c => c.category === '後期高齢者')).toBe(true);
  });

  it('handles age 0 (newborn)', () => {
    const result = getLawsByAgeCategory(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories.some(c => c.category === '乳児')).toBe(true);
  });
});
