'use client';

import React from 'react';

export interface LawRecommendation {
  law_id: string;
  law_title: string;
  law_num: string;
  relevance_reason: string;
  relevance_score: number;
  category: string;
  summary: string;
}

interface LawRecommendationCardProps {
  recommendation: LawRecommendation;
  onViewDetail?: (lawId: string) => void;
}

const categoryIcons: Record<string, string> = {
  '労働法': '👷',
  '税法': '💰',
  '社会保険': '🏥',
  '民法': '📜',
  '不動産': '🏠',
  '家族法': '👨‍👩‍👧',
  'default': '📋',
};

const categoryColors: Record<string, string> = {
  '労働法': 'bg-blue-50 border-blue-200 text-blue-800',
  '税法': 'bg-green-50 border-green-200 text-green-800',
  '社会保険': 'bg-purple-50 border-purple-200 text-purple-800',
  '民法': 'bg-gray-50 border-gray-200 text-gray-800',
  '不動産': 'bg-amber-50 border-amber-200 text-amber-800',
  '家族法': 'bg-pink-50 border-pink-200 text-pink-800',
  'default': 'bg-slate-50 border-slate-200 text-slate-800',
};

export function LawRecommendationCard({
  recommendation,
  onViewDetail,
}: LawRecommendationCardProps) {
  const icon = categoryIcons[recommendation.category] || categoryIcons['default'];
  const colorClass = categoryColors[recommendation.category] || categoryColors['default'];
  const scorePercentage = Math.round(recommendation.relevance_score * 100);

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(recommendation.law_id);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow ${colorClass}`}
      role="article"
      aria-label={`${recommendation.law_title}の推奨情報`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl" role="img" aria-label={recommendation.category}>
          {icon}
        </span>
        <span className="text-sm font-medium opacity-75">
          {recommendation.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold mb-1">
        {recommendation.law_title}
      </h3>

      {/* Law Number */}
      <p className="text-xs opacity-60 mb-3">
        {recommendation.law_num}
      </p>

      {/* Summary */}
      <p className="text-sm mb-3 line-clamp-3">
        {recommendation.summary}
      </p>

      {/* Relevance Reason */}
      <div className="bg-white/50 rounded p-2 mb-3">
        <p className="text-xs opacity-75 mb-1">関連理由</p>
        <p className="text-sm font-medium">
          {recommendation.relevance_reason}
        </p>
      </div>

      {/* Relevance Score */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span>関連度</span>
          <span>{scorePercentage}%</span>
        </div>
        <div className="h-2 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-current opacity-60 rounded-full transition-all duration-300"
            style={{ width: `${scorePercentage}%` }}
            role="progressbar"
            aria-valuenow={scorePercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleViewDetail}
        className="w-full py-2 px-4 bg-white/70 hover:bg-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
        aria-label={`${recommendation.law_title}の詳細を見る`}
      >
        詳細を見る →
      </button>
    </div>
  );
}

export default LawRecommendationCard;
