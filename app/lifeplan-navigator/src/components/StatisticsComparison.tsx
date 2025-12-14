'use client';

import { StatisticsComparison as StatisticsComparisonType } from '@/types';
import { formatCurrency } from '@/lib/simulation';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatisticsComparisonProps {
  statistics: StatisticsComparisonType[];
}

export default function StatisticsComparison({ statistics }: StatisticsComparisonProps) {
  const getComparisonStatus = (userValue: number, averageValue: number) => {
    const diff = ((userValue - averageValue) / averageValue) * 100;
    if (diff > 5) return { status: 'above', icon: TrendingUp, color: 'text-green-600' };
    if (diff < -5) return { status: 'below', icon: TrendingDown, color: 'text-red-600' };
    return { status: 'average', icon: Minus, color: 'text-gray-600' };
  };

  const formatValue = (category: string, value: number): string => {
    if (category.includes('比率') || category.includes('率')) {
      return `${value}%`;
    }
    return formatCurrency(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                項目
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                あなた
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                全国平均
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                同年収帯
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                順位
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {statistics.map((stat, index) => {
              const comparison = getComparisonStatus(stat.userValue, stat.averageValue);
              const Icon = comparison.icon;

              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${comparison.color}`} />
                      <span className="font-medium text-gray-900">{stat.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-primary-600">
                      {formatValue(stat.category, stat.userValue)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-600">
                    {formatValue(stat.category, stat.averageValue)}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-600">
                    {formatValue(stat.category, stat.sameIncomeValue)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${stat.percentile}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 min-w-[3rem]">
                        上位{100 - stat.percentile}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
        ※ 統計データは統計ダッシュボード、都民のくらしむきより引用（参考値）
      </div>
    </div>
  );
}
