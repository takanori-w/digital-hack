'use client';

import { useState } from 'react';
import { BenefitInfo } from '@/types';
import { formatCurrency } from '@/lib/simulation';
import { Gift, Percent, Tag, TrendingUp, ExternalLink, Clock, X, Info } from 'lucide-react';

interface BenefitCardProps {
  benefit: BenefitInfo;
}

const categoryIcons = {
  subsidy: Gift,
  tax: Percent,
  campaign: Tag,
  insurance: Percent,
  investment: TrendingUp,
};

const categoryLabels = {
  subsidy: '補助金',
  tax: '税制優遇',
  campaign: 'キャンペーン',
  insurance: '保険',
  investment: '投資',
};

const categoryColors = {
  subsidy: 'bg-green-100 text-green-800',
  tax: 'bg-blue-100 text-blue-800',
  campaign: 'bg-purple-100 text-purple-800',
  insurance: 'bg-orange-100 text-orange-800',
  investment: 'bg-cyan-100 text-cyan-800',
};

export default function BenefitCard({ benefit }: BenefitCardProps) {
  const [showModal, setShowModal] = useState(false);
  const Icon = categoryIcons[benefit.category];

  return (
    <>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 card-hover">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${categoryColors[benefit.category]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[benefit.category]}`}>
              {categoryLabels[benefit.category]}
            </span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              benefit.priority === 'high'
                ? 'priority-high'
                : benefit.priority === 'medium'
                ? 'priority-medium'
                : 'priority-low'
            }`}
          >
            {benefit.priority === 'high' ? '重要' : benefit.priority === 'medium' ? '推奨' : '参考'}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{benefit.description}</p>

        {benefit.amount && (
          <div className="mb-3">
            <span className="text-sm text-gray-500">最大</span>
            <span className="text-xl font-bold text-primary-600 ml-2">
              {formatCurrency(benefit.amount)}
            </span>
          </div>
        )}

        {benefit.deadline && (
          <div className="flex items-center gap-1 text-sm text-orange-600 mb-3">
            <Clock className="w-4 h-4" />
            <span>締切: {benefit.deadline}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{benefit.source}</span>
          <button
            onClick={() => setShowModal(true)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            詳細
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${categoryColors[benefit.category]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-sm px-2 py-1 rounded-full ${categoryColors[benefit.category]}`}>
                  {categoryLabels[benefit.category]}
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h2>

              {benefit.amount && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <span className="text-sm text-blue-600">最大受給額</span>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(benefit.amount)}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    概要
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>

                {benefit.deadline && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg text-orange-700">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">申請締切: {benefit.deadline}</span>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  出典: {benefit.source}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  閉じる
                </button>
                {benefit.applicationUrl && (
                  <a
                    href={benefit.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    公式サイトへ
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
