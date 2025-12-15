/**
 * Disclaimer Footer Translations
 *
 * Purpose: Multi-language support for legal disclaimer
 * Requirement: Auditor指示 APP-DISCLAIMER-001 (免責事項フッターのグローバル化)
 *
 * Supported Languages:
 * - ja: Japanese (日本語) - Primary
 * - en: English - International
 *
 * Legal Reference:
 * - 金融商品取引法に基づく表示義務
 * - Consumer protection disclaimer requirements
 */

export type SupportedLocale = 'ja' | 'en';

export interface DisclaimerTranslation {
  copyright: string;
  allRightsReserved: string;
  disclaimer: {
    informationPurpose: string;
    simulationDisclaimer: string;
  };
  links: {
    terms: string;
    privacy: string;
    legal: string;
  };
}

export const disclaimerTranslations: Record<SupportedLocale, DisclaimerTranslation> = {
  ja: {
    copyright: 'LifePlan Navigator',
    allRightsReserved: 'All rights reserved.',
    disclaimer: {
      informationPurpose:
        '本サービスは情報提供を目的としており、金融商品の勧誘を目的とするものではありません。',
      simulationDisclaimer:
        'シミュレーション結果は参考値であり、実際の運用結果を保証するものではありません。',
    },
    links: {
      terms: '利用規約',
      privacy: 'プライバシーポリシー',
      legal: '特定商取引法に基づく表記',
    },
  },
  en: {
    copyright: 'LifePlan Navigator',
    allRightsReserved: 'All rights reserved.',
    disclaimer: {
      informationPurpose:
        'This service is for informational purposes only and does not constitute financial advice or solicitation.',
      simulationDisclaimer:
        'Simulation results are estimates only and do not guarantee actual investment outcomes.',
    },
    links: {
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      legal: 'Legal Notice',
    },
  },
};

/**
 * Get disclaimer translations for a given locale
 * Falls back to Japanese if locale is not supported
 */
export function getDisclaimerTranslation(locale: string): DisclaimerTranslation {
  const supportedLocale = locale.substring(0, 2).toLowerCase();
  if (supportedLocale in disclaimerTranslations) {
    return disclaimerTranslations[supportedLocale as SupportedLocale];
  }
  // Default to Japanese for unsupported locales
  return disclaimerTranslations.ja;
}
