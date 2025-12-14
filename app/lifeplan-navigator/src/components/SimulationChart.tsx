'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { getAllScenarioResults, formatCurrency, getRetirementAdvice, calculateSavingsFromBenefits } from '@/lib/simulation';
import { scenarioConfigs } from '@/data/mockData';
import { SimulationParams } from '@/types';
import { TrendingUp, AlertTriangle, Lightbulb, Calculator } from 'lucide-react';

export default function SimulationChart() {
  const { user } = useAppStore();
  const [selectedScenario, setSelectedScenario] = useState<string>('all');

  const params: SimulationParams = useMemo(
    () => ({
      currentAge: user ? new Date().getFullYear() - new Date(user.birthDate).getFullYear() : 35,
      retirementAge: 65,
      currentIncome: user?.annualIncome || 5000000,
      incomeGrowthRate: 0.02,
      currentSavings: 2000000,
      monthlySavingsRate: 0.2,
      investmentReturnRate: 0.05,
      inflationRate: 0.02,
    }),
    [user]
  );

  const allResults = useMemo(() => getAllScenarioResults(params), [params]);

  // チャート用データ作成
  const chartData = useMemo(() => {
    const conservative = allResults.conservative;
    return conservative.map((_, index) => ({
      age: allResults.conservative[index].age,
      year: allResults.conservative[index].year,
      conservative: allResults.conservative[index].totalAssets,
      moderate: allResults.moderate[index].totalAssets,
      aggressive: allResults.aggressive[index].totalAssets,
    }));
  }, [allResults]);

  // 退職時の資産
  const retirementAssets = useMemo(() => {
    const retirementIndex = allResults.conservative.findIndex((r) => r.age === 65);
    return {
      conservative: allResults.conservative[retirementIndex]?.totalAssets || 0,
      moderate: allResults.moderate[retirementIndex]?.totalAssets || 0,
      aggressive: allResults.aggressive[retirementIndex]?.totalAssets || 0,
    };
  }, [allResults]);

  // 得した金額の投資効果
  const savingsEffect = calculateSavingsFromBenefits(500000, 0.05, 30);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{label}歳</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">将来シミュレーション</h2>
            <p className="text-sm text-gray-500 mt-1">3つのシナリオで将来の資産推移を予測</p>
          </div>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">すべて表示</option>
            <option value="conservative">現状維持のみ</option>
            <option value="moderate">成長のみ</option>
            <option value="aggressive">急成長のみ</option>
          </select>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorModerate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAggressive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="age" tickFormatter={(value) => `${value}歳`} stroke="#9ca3af" />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#9ca3af"
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {(selectedScenario === 'all' || selectedScenario === 'conservative') && (
                <Area
                  type="monotone"
                  dataKey="conservative"
                  name="現状維持"
                  stroke="#94a3b8"
                  fillOpacity={1}
                  fill="url(#colorConservative)"
                  strokeWidth={2}
                />
              )}
              {(selectedScenario === 'all' || selectedScenario === 'moderate') && (
                <Area
                  type="monotone"
                  dataKey="moderate"
                  name="成長"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorModerate)"
                  strokeWidth={2}
                />
              )}
              {(selectedScenario === 'all' || selectedScenario === 'aggressive') && (
                <Area
                  type="monotone"
                  dataKey="aggressive"
                  name="急成長"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorAggressive)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(scenarioConfigs).map(([key, config]) => (
          <div
            key={key}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 card-hover"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <h3 className="font-semibold text-gray-900">{config.label}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{config.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">収入成長率</span>
                <span className="font-medium">{(config.incomeGrowthRate * 100).toFixed(0)}%/年</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">投資リターン</span>
                <span className="font-medium">{(config.investmentReturnRate * 100).toFixed(0)}%/年</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">貯蓄率</span>
                <span className="font-medium">{(config.savingsRate * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">65歳時点の資産</span>
              <div className="text-xl font-bold" style={{ color: config.color }}>
                {formatCurrency(retirementAssets[key as keyof typeof retirementAssets])}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advice & Investment Effect */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">アドバイス</h3>
          </div>
          <p className="text-sm text-gray-600">
            {getRetirementAdvice(allResults.moderate, 65)}
          </p>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-800">
                ※ このシミュレーションは参考値です。実際の運用結果は市場環境により異なります。
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">得した金額の投資効果</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            補助金や税制優遇で得た50万円を30年間運用した場合
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">元本</span>
              <span className="font-medium">{formatCurrency(500000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">30年後（年利5%）</span>
              <span className="text-xl font-bold text-primary-600">
                {formatCurrency(savingsEffect)}
              </span>
            </div>
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              複利効果で約{((savingsEffect / 500000 - 1) * 100).toFixed(0)}%増加
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
