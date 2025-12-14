'use client';

import React from 'react';

// 動物アイコンSVGコンポーネント - Zoo テーマ
export const AnimalIcons = {
  // ライオン - リーダーシップ、力強さ
  lion: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#F59E0B"/>
      <circle cx="32" cy="36" r="18" fill="#FBBF24"/>
      <circle cx="24" cy="30" r="3" fill="#1F2937"/>
      <circle cx="40" cy="30" r="3" fill="#1F2937"/>
      <ellipse cx="32" cy="38" rx="4" ry="3" fill="#1F2937"/>
      <path d="M28 42 Q32 46 36 42" stroke="#1F2937" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // フクロウ - 知恵、学び
  owl: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="36" rx="20" ry="22" fill="#6B7280"/>
      <circle cx="24" cy="30" r="8" fill="#FBBF24"/>
      <circle cx="40" cy="30" r="8" fill="#FBBF24"/>
      <circle cx="24" cy="30" r="4" fill="#1F2937"/>
      <circle cx="40" cy="30" r="4" fill="#1F2937"/>
      <polygon points="32,36 28,42 36,42" fill="#F59E0B"/>
      <path d="M16 16 L24 24" stroke="#6B7280" strokeWidth="3" strokeLinecap="round"/>
      <path d="M48 16 L40 24" stroke="#6B7280" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),

  // リス - 貯蓄、計画性
  squirrel: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="38" rx="16" ry="18" fill="#D97706"/>
      <circle cx="32" cy="26" r="14" fill="#F59E0B"/>
      <circle cx="26" cy="24" r="2" fill="#1F2937"/>
      <circle cx="38" cy="24" r="2" fill="#1F2937"/>
      <ellipse cx="32" cy="30" rx="3" ry="2" fill="#1F2937"/>
      <ellipse cx="24" cy="16" r="4" fill="#F59E0B"/>
      <ellipse cx="40" cy="16" r="4" fill="#F59E0B"/>
      <path d="M48 48 Q56 40 52 32" stroke="#D97706" strokeWidth="6" strokeLinecap="round"/>
    </svg>
  ),

  // ペンギン - 家族、協力
  penguin: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="38" rx="18" ry="22" fill="#1F2937"/>
      <ellipse cx="32" cy="40" rx="12" ry="16" fill="#F3F4F6"/>
      <circle cx="26" cy="26" r="3" fill="#F3F4F6"/>
      <circle cx="38" cy="26" r="3" fill="#F3F4F6"/>
      <circle cx="26" cy="26" r="1.5" fill="#1F2937"/>
      <circle cx="38" cy="26" r="1.5" fill="#1F2937"/>
      <polygon points="32,30 28,36 36,36" fill="#F59E0B"/>
      <ellipse cx="16" cy="38" rx="4" ry="8" fill="#1F2937"/>
      <ellipse cx="48" cy="38" rx="4" ry="8" fill="#1F2937"/>
    </svg>
  ),

  // キツネ - 知恵、適応力
  fox: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,8 48,28 16,28" fill="#EA580C"/>
      <ellipse cx="32" cy="38" rx="16" ry="18" fill="#EA580C"/>
      <ellipse cx="32" cy="44" rx="8" ry="6" fill="#F3F4F6"/>
      <circle cx="26" cy="30" r="3" fill="#1F2937"/>
      <circle cx="38" cy="30" r="3" fill="#1F2937"/>
      <ellipse cx="32" cy="38" rx="3" ry="2" fill="#1F2937"/>
      <polygon points="20,12 16,28 24,24" fill="#EA580C"/>
      <polygon points="44,12 48,28 40,24" fill="#EA580C"/>
    </svg>
  ),

  // コアラ - リラックス、安定
  koala: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="24" r="10" fill="#6B7280"/>
      <circle cx="46" cy="24" r="10" fill="#6B7280"/>
      <circle cx="32" cy="36" r="18" fill="#9CA3AF"/>
      <ellipse cx="32" cy="42" rx="8" ry="6" fill="#D1D5DB"/>
      <circle cx="26" cy="32" r="3" fill="#1F2937"/>
      <circle cx="38" cy="32" r="3" fill="#1F2937"/>
      <ellipse cx="32" cy="40" rx="5" ry="3" fill="#1F2937"/>
    </svg>
  ),

  // ウサギ - 成長、繁栄
  rabbit: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="16" rx="6" ry="14" fill="#F9A8D4"/>
      <ellipse cx="40" cy="16" rx="6" ry="14" fill="#F9A8D4"/>
      <ellipse cx="24" cy="16" rx="3" ry="10" fill="#FBCFE8"/>
      <ellipse cx="40" cy="16" rx="3" ry="10" fill="#FBCFE8"/>
      <circle cx="32" cy="40" r="18" fill="#F9A8D4"/>
      <circle cx="26" cy="36" r="3" fill="#1F2937"/>
      <circle cx="38" cy="36" r="3" fill="#1F2937"/>
      <ellipse cx="32" cy="44" rx="3" ry="2" fill="#EC4899"/>
      <circle cx="22" cy="46" r="4" fill="#FBCFE8"/>
      <circle cx="42" cy="46" r="4" fill="#FBCFE8"/>
    </svg>
  ),

  // イヌ - 忠誠、信頼
  dog: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="24" rx="8" ry="12" fill="#92400E"/>
      <ellipse cx="48" cy="24" rx="8" ry="12" fill="#92400E"/>
      <circle cx="32" cy="36" r="18" fill="#D97706"/>
      <ellipse cx="32" cy="42" rx="10" ry="8" fill="#FEF3C7"/>
      <circle cx="26" cy="32" r="3" fill="#1F2937"/>
      <circle cx="38" cy="32" r="3" fill="#1F2937"/>
      <ellipse cx="32" cy="40" rx="4" ry="3" fill="#1F2937"/>
      <path d="M26 48 Q32 52 38 48" stroke="#1F2937" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  // ネコ - 独立、自由
  cat: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="18,12 14,32 26,28" fill="#6B7280"/>
      <polygon points="46,12 50,32 38,28" fill="#6B7280"/>
      <circle cx="32" cy="38" r="18" fill="#9CA3AF"/>
      <ellipse cx="26" cy="34" rx="4" ry="5" fill="#22C55E"/>
      <ellipse cx="38" cy="34" rx="4" ry="5" fill="#22C55E"/>
      <ellipse cx="26" cy="34" rx="1.5" ry="4" fill="#1F2937"/>
      <ellipse cx="38" cy="34" rx="1.5" ry="4" fill="#1F2937"/>
      <ellipse cx="32" cy="42" rx="3" ry="2" fill="#EC4899"/>
      <line x1="18" y1="40" x2="10" y2="38" stroke="#6B7280" strokeWidth="2"/>
      <line x1="18" y1="44" x2="10" y2="46" stroke="#6B7280" strokeWidth="2"/>
      <line x1="46" y1="40" x2="54" y2="38" stroke="#6B7280" strokeWidth="2"/>
      <line x1="46" y1="44" x2="54" y2="46" stroke="#6B7280" strokeWidth="2"/>
    </svg>
  ),

  // カメ - 安定、長寿
  turtle: ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="40" rx="22" ry="16" fill="#16A34A"/>
      <ellipse cx="32" cy="38" rx="18" ry="12" fill="#22C55E"/>
      <circle cx="32" cy="38" r="6" fill="#15803D"/>
      <circle cx="44" cy="36" r="4" fill="#15803D"/>
      <circle cx="20" cy="36" r="4" fill="#15803D"/>
      <circle cx="38" cy="44" r="3" fill="#15803D"/>
      <circle cx="26" cy="44" r="3" fill="#15803D"/>
      <ellipse cx="32" cy="22" rx="8" ry="10" fill="#86EFAC"/>
      <circle cx="29" cy="20" r="2" fill="#1F2937"/>
      <circle cx="35" cy="20" r="2" fill="#1F2937"/>
      <ellipse cx="14" cy="44" rx="4" ry="3" fill="#86EFAC"/>
      <ellipse cx="50" cy="44" rx="4" ry="3" fill="#86EFAC"/>
    </svg>
  ),
};

// ユーザーのパーソナリティに基づいて動物を選択するタイプ
export type AnimalType = keyof typeof AnimalIcons;

// 動物の説明
export const animalDescriptions: Record<AnimalType, { name: string; trait: string; emoji: string }> = {
  lion: { name: 'ライオン', trait: 'リーダーシップ', emoji: '🦁' },
  owl: { name: 'フクロウ', trait: '知恵・学び', emoji: '🦉' },
  squirrel: { name: 'リス', trait: '貯蓄・計画性', emoji: '🐿️' },
  penguin: { name: 'ペンギン', trait: '家族・協力', emoji: '🐧' },
  fox: { name: 'キツネ', trait: '適応力・知恵', emoji: '🦊' },
  koala: { name: 'コアラ', trait: '安定・リラックス', emoji: '🐨' },
  rabbit: { name: 'ウサギ', trait: '成長・繁栄', emoji: '🐰' },
  dog: { name: 'イヌ', trait: '忠誠・信頼', emoji: '🐕' },
  cat: { name: 'ネコ', trait: '独立・自由', emoji: '🐱' },
  turtle: { name: 'カメ', trait: '安定・長寿', emoji: '🐢' },
};

// ゴールに基づいて推奨動物を決定
export function getRecommendedAnimal(goals: string[]): AnimalType {
  if (goals.includes('savings') || goals.includes('investment')) return 'squirrel';
  if (goals.includes('housing')) return 'turtle';
  if (goals.includes('education')) return 'owl';
  if (goals.includes('retirement')) return 'koala';
  if (goals.includes('benefits')) return 'fox';
  if (goals.includes('tax')) return 'owl';
  return 'dog';
}

// ライフステージに基づいて動物を決定
export function getAnimalByLifeStage(lifeStage: string): AnimalType {
  switch (lifeStage) {
    case 'student': return 'owl';
    case 'new_graduate': return 'rabbit';
    case 'working_single': return 'fox';
    case 'newlywed': return 'penguin';
    case 'child_rearing': return 'penguin';
    case 'child_education': return 'owl';
    case 'empty_nest': return 'koala';
    case 'pre_retirement': return 'turtle';
    case 'retired': return 'turtle';
    default: return 'dog';
  }
}

// 動物アイコンを表示するコンポーネント
interface AnimalAvatarProps {
  animal: AnimalType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
}

export function AnimalAvatar({ animal, size = 'md', showName = false }: AnimalAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const Icon = AnimalIcons[animal];
  const description = animalDescriptions[animal];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-50 to-emerald-50 p-1 shadow-sm`}>
        <Icon className="w-full h-full" />
      </div>
      {showName && (
        <span className="text-xs font-medium text-gray-600">
          {description.emoji} {description.name}
        </span>
      )}
    </div>
  );
}

// 動物選択グリッド
interface AnimalSelectorProps {
  selected: AnimalType | null;
  onSelect: (animal: AnimalType) => void;
}

export function AnimalSelector({ selected, onSelect }: AnimalSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {(Object.keys(AnimalIcons) as AnimalType[]).map((animal) => {
        const description = animalDescriptions[animal];
        const Icon = AnimalIcons[animal];
        return (
          <button
            key={animal}
            onClick={() => onSelect(animal)}
            className={`p-3 rounded-xl border-2 transition-all ${
              selected === animal
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-10 h-10 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-700">{description.name}</p>
            <p className="text-xs text-gray-500">{description.trait}</p>
          </button>
        );
      })}
    </div>
  );
}
