import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  calculateInvestmentGrowth,
  calculateSavingsFromBenefits,
  getRetirementAdvice,
} from '../simulation'
import { SimulationResult } from '@/types'

describe('formatCurrency', () => {
  it('formats amounts in 円 for values under 10000', () => {
    expect(formatCurrency(5000)).toBe('5,000円')
  })

  it('formats amounts in 万円 for values 10000 or more', () => {
    expect(formatCurrency(10000)).toBe('1万円')
    expect(formatCurrency(50000)).toBe('5万円')
    expect(formatCurrency(500000)).toBe('50万円')
  })

  it('formats amounts in 億円 for values 100000000 or more', () => {
    expect(formatCurrency(100000000)).toBe('1.0億円')
    expect(formatCurrency(250000000)).toBe('2.5億円')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('0円')
  })

  it('rounds to nearest 万円 for large numbers', () => {
    expect(formatCurrency(15000)).toBe('2万円')
    expect(formatCurrency(14999)).toBe('1万円')
  })
})

describe('calculateInvestmentGrowth', () => {
  it('calculates future value of principal with no contributions', () => {
    // 100万円を年利5%で10年運用
    const result = calculateInvestmentGrowth(1000000, 0, 0.05, 10)
    // 複利で約163万円になるはず
    expect(result).toBeGreaterThan(1600000)
    expect(result).toBeLessThan(1700000)
  })

  it('calculates future value with monthly contributions', () => {
    // 毎月3万円を年利5%で10年積立
    const result = calculateInvestmentGrowth(0, 30000, 0.05, 10)
    // 元本360万 + 運用益
    expect(result).toBeGreaterThan(4500000)
  })

  it('handles zero return rate', () => {
    const result = calculateInvestmentGrowth(100000, 10000, 0, 12)
    // 100000 + 10000 * 12 * 12 = 1540000
    expect(result).toBe(1540000)
  })

  it('combines principal and monthly contributions', () => {
    const result = calculateInvestmentGrowth(1000000, 50000, 0.03, 5)
    // Should be more than principal + total contributions
    expect(result).toBeGreaterThan(1000000 + 50000 * 60)
  })
})

describe('calculateSavingsFromBenefits', () => {
  it('calculates future value of benefit amount invested', () => {
    // 50万円を年利5%で10年運用
    const result = calculateSavingsFromBenefits(500000, 0.05, 10)
    expect(result).toBeGreaterThan(800000)
  })

  it('returns principal with zero return rate', () => {
    const result = calculateSavingsFromBenefits(100000, 0, 5)
    expect(result).toBe(100000)
  })
})

describe('getRetirementAdvice', () => {
  const createMockResults = (finalAssets: number): SimulationResult[] => [
    {
      year: 2024,
      age: 30,
      income: 5000000,
      expenses: 4000000,
      savings: 1000000,
      investmentValue: 500000,
      totalAssets: 1500000,
    },
    {
      year: 2059,
      age: 65,
      income: 3000000,
      expenses: 2500000,
      savings: 20000000,
      investmentValue: 30000000,
      totalAssets: 50000000,
    },
    {
      year: 2084,
      age: 90,
      income: 3000000,
      expenses: 2500000,
      savings: 10000000,
      investmentValue: finalAssets - 10000000,
      totalAssets: finalAssets,
    },
  ]

  it('returns warning for negative final assets', () => {
    const results = createMockResults(-5000000)
    const advice = getRetirementAdvice(results, 65)
    expect(advice).toContain('不足する可能性')
  })

  it('returns caution for low final assets', () => {
    const results = createMockResults(5000000)
    const advice = getRetirementAdvice(results, 65)
    expect(advice).toContain('不足気味')
  })

  it('returns moderate advice for standard assets', () => {
    const results = createMockResults(20000000)
    const advice = getRetirementAdvice(results, 65)
    expect(advice).toContain('標準的な老後資金')
  })

  it('returns positive advice for high assets', () => {
    const results = createMockResults(50000000)
    const advice = getRetirementAdvice(results, 65)
    expect(advice).toContain('十分な老後資金')
  })

  it('handles missing retirement year result', () => {
    const results: SimulationResult[] = []
    const advice = getRetirementAdvice(results, 65)
    expect(advice).toContain('計算できませんでした')
  })
})
