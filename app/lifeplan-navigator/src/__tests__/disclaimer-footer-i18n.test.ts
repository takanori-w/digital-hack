/**
 * Disclaimer Footer Internationalization Tests
 *
 * Requirement: APP-DISCLAIMER-001 (免責事項フッターのグローバル化)
 * Tests multi-language support for legal disclaimer footer
 */

import { describe, it, expect } from 'vitest';
import {
  getDisclaimerTranslation,
  disclaimerTranslations,
  type SupportedLocale,
} from '@/lib/i18n/disclaimer-translations';

describe('Disclaimer Translations', () => {
  describe('getDisclaimerTranslation', () => {
    it('should return Japanese translations for "ja" locale', () => {
      const result = getDisclaimerTranslation('ja');
      expect(result.disclaimer.informationPurpose).toContain('情報提供');
      expect(result.links.terms).toBe('利用規約');
    });

    it('should return English translations for "en" locale', () => {
      const result = getDisclaimerTranslation('en');
      expect(result.disclaimer.informationPurpose).toContain('informational purposes');
      expect(result.links.terms).toBe('Terms of Service');
    });

    it('should return Japanese as default for unsupported locales', () => {
      const result = getDisclaimerTranslation('fr'); // French - not supported
      expect(result.disclaimer.informationPurpose).toContain('情報提供');
    });

    it('should handle locale strings with region codes (e.g., "en-US")', () => {
      const result = getDisclaimerTranslation('en-US');
      expect(result.links.terms).toBe('Terms of Service');
    });

    it('should handle locale strings with region codes (e.g., "ja-JP")', () => {
      const result = getDisclaimerTranslation('ja-JP');
      expect(result.links.terms).toBe('利用規約');
    });
  });

  describe('Translation completeness', () => {
    const requiredKeys = [
      'copyright',
      'allRightsReserved',
      'disclaimer.informationPurpose',
      'disclaimer.simulationDisclaimer',
      'links.terms',
      'links.privacy',
      'links.legal',
    ];

    const locales: SupportedLocale[] = ['ja', 'en'];

    locales.forEach((locale) => {
      it(`should have all required keys for locale: ${locale}`, () => {
        const translation = disclaimerTranslations[locale];

        expect(translation.copyright).toBeDefined();
        expect(translation.copyright.length).toBeGreaterThan(0);

        expect(translation.allRightsReserved).toBeDefined();
        expect(translation.allRightsReserved.length).toBeGreaterThan(0);

        expect(translation.disclaimer.informationPurpose).toBeDefined();
        expect(translation.disclaimer.informationPurpose.length).toBeGreaterThan(0);

        expect(translation.disclaimer.simulationDisclaimer).toBeDefined();
        expect(translation.disclaimer.simulationDisclaimer.length).toBeGreaterThan(0);

        expect(translation.links.terms).toBeDefined();
        expect(translation.links.terms.length).toBeGreaterThan(0);

        expect(translation.links.privacy).toBeDefined();
        expect(translation.links.privacy.length).toBeGreaterThan(0);

        expect(translation.links.legal).toBeDefined();
        expect(translation.links.legal.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Legal compliance', () => {
    it('should include financial services disclaimer in Japanese', () => {
      const ja = disclaimerTranslations.ja;
      // 金融商品取引法に基づく表示義務
      expect(ja.disclaimer.informationPurpose).toContain('金融商品');
    });

    it('should include financial services disclaimer in English', () => {
      const en = disclaimerTranslations.en;
      expect(en.disclaimer.informationPurpose).toContain('financial');
    });

    it('should include simulation disclaimer warning', () => {
      const ja = disclaimerTranslations.ja;
      expect(ja.disclaimer.simulationDisclaimer).toContain('保証');

      const en = disclaimerTranslations.en;
      expect(en.disclaimer.simulationDisclaimer).toContain('guarantee');
    });
  });
});
