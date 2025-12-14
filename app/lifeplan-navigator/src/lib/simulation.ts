import { SimulationParams, SimulationResult, ScenarioConfig } from '@/types';
import { scenarioConfigs } from '@/data/mockData';

export function runSimulation(
  params: SimulationParams,
  scenario: ScenarioConfig
): SimulationResult[] {
  const results: SimulationResult[] = [];

  let currentIncome = params.currentIncome;
  let currentSavings = params.currentSavings;
  let investmentValue = 0;

  const yearsToSimulate = params.retirementAge - params.currentAge + 20; // 退職後20年まで

  for (let year = 0; year <= yearsToSimulate; year++) {
    const age = params.currentAge + year;

    // 収入計算（退職後は年金として現役時の40%と仮定）
    if (age < params.retirementAge) {
      currentIncome *= 1 + scenario.incomeGrowthRate;
    } else if (age === params.retirementAge) {
      currentIncome = currentIncome * 0.4; // 年金
    }

    // 支出計算（インフレ考慮、収入の一定割合）
    const expenses = currentIncome * (1 - scenario.savingsRate) * Math.pow(1 + params.inflationRate, year);

    // 貯蓄計算
    const yearlyInvestment = age < params.retirementAge ? currentIncome * scenario.savingsRate : 0;

    // 投資運用
    investmentValue = (investmentValue + yearlyInvestment) * (1 + scenario.investmentReturnRate);

    // 退職後は資産を取り崩し
    if (age >= params.retirementAge) {
      const withdrawal = Math.max(0, expenses - currentIncome);
      investmentValue = Math.max(0, investmentValue - withdrawal);
    }

    currentSavings += age < params.retirementAge ? yearlyInvestment * 0.3 : 0; // 貯蓄は投資の30%

    results.push({
      year: new Date().getFullYear() + year,
      age,
      income: Math.round(currentIncome),
      expenses: Math.round(expenses),
      savings: Math.round(currentSavings),
      investmentValue: Math.round(investmentValue),
      totalAssets: Math.round(currentSavings + investmentValue),
    });
  }

  return results;
}

export function calculateInvestmentGrowth(
  principal: number,
  monthlyContribution: number,
  annualReturnRate: number,
  years: number
): number {
  // 複利計算（月次）
  const monthlyRate = annualReturnRate / 12;
  const months = years * 12;

  // 元本の成長
  let futureValue = principal * Math.pow(1 + monthlyRate, months);

  // 毎月の積立の成長
  if (monthlyRate > 0) {
    futureValue += monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  } else {
    futureValue += monthlyContribution * months;
  }

  return Math.round(futureValue);
}

export function calculateSavingsFromBenefits(
  benefitAmount: number,
  investmentReturnRate: number,
  years: number
): number {
  // 得した金額を投資に回した場合の効果
  return calculateInvestmentGrowth(benefitAmount, 0, investmentReturnRate, years);
}

export function getAllScenarioResults(params: SimulationParams): Record<string, SimulationResult[]> {
  return {
    conservative: runSimulation(params, scenarioConfigs.conservative),
    moderate: runSimulation(params, scenarioConfigs.moderate),
    aggressive: runSimulation(params, scenarioConfigs.aggressive),
  };
}

export function formatCurrency(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}億円`;
  } else if (amount >= 10000) {
    return `${Math.round(amount / 10000)}万円`;
  }
  return `${amount.toLocaleString()}円`;
}

export function getRetirementAdvice(results: SimulationResult[], retirementAge: number): string {
  const retirementYearResult = results.find((r) => r.age === retirementAge);
  const finalResult = results[results.length - 1];

  if (!retirementYearResult || !finalResult) {
    return '計算できませんでした。';
  }

  if (finalResult.totalAssets < 0) {
    return '現在のペースでは老後資金が不足する可能性があります。貯蓄率や投資を見直すことをお勧めします。';
  } else if (finalResult.totalAssets < 10000000) {
    return '老後の資金がやや不足気味です。今からでも積立投資を始めることで改善できます。';
  } else if (finalResult.totalAssets < 30000000) {
    return '標準的な老後資金を確保できる見込みです。さらに余裕を持たせたい場合は投資額の増額を検討してください。';
  }
  return '十分な老後資金を確保できる見込みです。引き続き計画的な資産形成を続けてください。';
}
