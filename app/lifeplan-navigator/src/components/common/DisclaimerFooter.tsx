'use client';

/**
 * DisclaimerFooter - Global Disclaimer Component
 *
 * Purpose: Display legal disclaimer on all pages
 * Requirement: Auditor指示 APP-017 (免責事項全画面フッター実装)
 *
 * Legal Reference:
 * - 金融商品取引法に基づく表示義務
 * - 消費者保護のための免責事項明示
 */

import React from 'react';

interface DisclaimerFooterProps {
  /** Additional CSS classes */
  className?: string;
  /** Show compact version (single line) */
  compact?: boolean;
}

export function DisclaimerFooter({ className = '', compact = false }: DisclaimerFooterProps) {
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer className={`bg-gray-100 border-t border-gray-200 py-2 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500">
          <p>
            {currentYear} LifePlan Navigator |
            本サービスは情報提供を目的としており、金融商品の勧誘を目的とするものではありません。
            シミュレーション結果は参考値であり、実際の運用結果を保証するものではありません。
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`bg-gray-50 border-t border-gray-200 py-4 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm text-gray-600">
          &copy; {currentYear} LifePlan Navigator. All rights reserved.
        </p>
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <p>
            本サービスは情報提供を目的としており、金融商品の勧誘を目的とするものではありません。
          </p>
          <p>
            シミュレーション結果は参考値であり、実際の運用結果を保証するものではありません。
          </p>
          <p className="mt-2">
            <a href="/terms" className="hover:text-primary-600 underline">利用規約</a>
            {' | '}
            <a href="/privacy" className="hover:text-primary-600 underline">プライバシーポリシー</a>
            {' | '}
            <a href="/legal" className="hover:text-primary-600 underline">特定商取引法に基づく表記</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default DisclaimerFooter;
