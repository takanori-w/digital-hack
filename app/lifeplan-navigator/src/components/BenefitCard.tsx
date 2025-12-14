'use client';

import { BenefitInfo } from '@/types';
import { formatCurrency } from '@/lib/simulation';
import { Gift, Percent, Tag, TrendingUp, ExternalLink, Clock } from 'lucide-react';

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
  const Icon = categoryIcons[benefit.category];

  return (
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
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
          詳細
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
