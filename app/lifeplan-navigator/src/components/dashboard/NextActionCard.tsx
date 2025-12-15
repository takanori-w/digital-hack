'use client';

import React from 'react';

export interface NextAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  relatedLaw?: string;
  steps?: string[];
}

interface NextActionCardProps {
  action: NextAction;
  onComplete?: (actionId: string) => void;
  onDismiss?: (actionId: string) => void;
}

const priorityConfig = {
  high: {
    label: 'HIGH',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeColor: 'bg-red-500 text-white',
    textColor: 'text-red-800',
  },
  medium: {
    label: 'MEDIUM',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badgeColor: 'bg-yellow-500 text-white',
    textColor: 'text-yellow-800',
  },
  low: {
    label: 'LOW',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badgeColor: 'bg-green-500 text-white',
    textColor: 'text-green-800',
  },
};

export function NextActionCard({
  action,
  onComplete,
  onDismiss,
}: NextActionCardProps) {
  const config = priorityConfig[action.priority];

  const handleComplete = () => {
    if (onComplete) {
      onComplete(action.id);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(action.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow ${config.bgColor} ${config.borderColor}`}
      role="article"
      aria-label={`アクション: ${action.title}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="ターゲット">
            🎯
          </span>
          <span className={`text-sm font-medium ${config.textColor}`}>
            おすすめのアクション
          </span>
        </div>
        <span
          className={`px-2 py-1 text-xs font-bold rounded ${config.badgeColor}`}
        >
          {config.label}
        </span>
      </div>

      {/* Title */}
      <h3 className={`text-lg font-bold mb-2 ${config.textColor}`}>
        {action.title}
      </h3>

      {/* Description */}
      <p className={`text-sm mb-3 ${config.textColor} opacity-80`}>
        {action.description}
      </p>

      {/* Steps */}
      {action.steps && action.steps.length > 0 && (
        <div className="mb-3">
          <p className={`text-xs font-medium mb-2 ${config.textColor} opacity-70`}>
            ステップ:
          </p>
          <ol className="list-decimal list-inside space-y-1">
            {action.steps.map((step, index) => (
              <li
                key={index}
                className={`text-sm ${config.textColor} opacity-80`}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Related Law */}
      {action.relatedLaw && (
        <p className={`text-xs mb-3 ${config.textColor} opacity-60`}>
          関連法令: {action.relatedLaw}
        </p>
      )}

      {/* Due Date */}
      {action.dueDate && (
        <div className={`flex items-center gap-1 mb-4 text-sm ${config.textColor}`}>
          <span role="img" aria-label="カレンダー">📅</span>
          <span>期限: {formatDate(action.dueDate)}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleComplete}
          className={`flex-1 py-2 px-4 bg-white/70 hover:bg-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.textColor}`}
          aria-label={`${action.title}を完了としてマーク`}
        >
          完了
        </button>
        <button
          onClick={handleDismiss}
          className={`flex-1 py-2 px-4 bg-white/30 hover:bg-white/50 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.textColor} opacity-70`}
          aria-label={`${action.title}を後で確認`}
        >
          後で確認
        </button>
      </div>
    </div>
  );
}

export default NextActionCard;
