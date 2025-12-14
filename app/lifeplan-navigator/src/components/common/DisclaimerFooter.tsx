'use client';

/**
 * DisclaimerFooter - Global Disclaimer Component (Internationalized)
 *
 * Purpose: Display legal disclaimer on all pages with multi-language support
 * Requirement: Auditor指示 APP-017 (免責事項全画面フッター実装)
 * Requirement: Auditor指示 APP-DISCLAIMER-001 (免責事項フッターのグローバル化)
 *
 * Legal Reference:
 * - 金融商品取引法に基づく表示義務
 * - 消費者保護のための免責事項明示
 * - International consumer protection requirements
 *
 * Supported Languages:
 * - ja: Japanese (日本語) - Default
 * - en: English - International
 */

import React, { useEffect, useState } from 'react';
import {
  getDisclaimerTranslation,
  type DisclaimerTranslation,
  type SupportedLocale,
} from '@/lib/i18n/disclaimer-translations';

interface DisclaimerFooterProps {
  /** Additional CSS classes */
  className?: string;
  /** Show compact version (single line) */
  compact?: boolean;
  /** Override locale (defaults to document lang attribute) */
  locale?: SupportedLocale;
}

export function DisclaimerFooter({
  className = '',
  compact = false,
  locale,
}: DisclaimerFooterProps) {
  const currentYear = new Date().getFullYear();
  const [translations, setTranslations] = useState<DisclaimerTranslation>(() =>
    getDisclaimerTranslation(locale || 'ja')
  );

  useEffect(() => {
    // If locale is explicitly provided, use it
    if (locale) {
      setTranslations(getDisclaimerTranslation(locale));
      return;
    }

    // Otherwise, detect from document lang attribute
    if (typeof document !== 'undefined') {
      const htmlLang = document.documentElement.lang || 'ja';
      setTranslations(getDisclaimerTranslation(htmlLang));
    }
  }, [locale]);

  if (compact) {
    return (
      <footer
        className={`bg-gray-100 border-t border-gray-200 py-2 ${className}`}
        role="contentinfo"
        aria-label="Legal disclaimer"
      >
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500">
          <p>
            &copy; {currentYear} {translations.copyright} |{' '}
            {translations.disclaimer.informationPurpose}{' '}
            {translations.disclaimer.simulationDisclaimer}
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`bg-gray-50 border-t border-gray-200 py-4 ${className}`}
      role="contentinfo"
      aria-label="Legal disclaimer"
    >
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm text-gray-600">
          &copy; {currentYear} {translations.copyright}. {translations.allRightsReserved}
        </p>
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <p>{translations.disclaimer.informationPurpose}</p>
          <p>{translations.disclaimer.simulationDisclaimer}</p>
          <p className="mt-2">
            <a href="/terms" className="hover:text-primary-600 underline">
              {translations.links.terms}
            </a>
            {' | '}
            <a href="/privacy" className="hover:text-primary-600 underline">
              {translations.links.privacy}
            </a>
            {' | '}
            <a href="/legal" className="hover:text-primary-600 underline">
              {translations.links.legal}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default DisclaimerFooter;
