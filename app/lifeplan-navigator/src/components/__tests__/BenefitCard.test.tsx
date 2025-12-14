import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BenefitCard from '../BenefitCard'
import { BenefitInfo } from '@/types'

const mockBenefit: BenefitInfo = {
  id: 'benefit-1',
  title: 'テスト補助金',
  description: 'これはテスト用の補助金です。テスト目的で作成されています。',
  category: 'subsidy',
  amount: 500000,
  deadline: '2024-12-31',
  targetLifeStages: ['working_single'],
  targetPrefectures: ['東京都'],
  targetIncomeRange: [3000000, 8000000],
  applicationUrl: 'https://example.com',
  source: 'テスト省',
  createdAt: '2024-01-01',
  priority: 'high',
}

describe('BenefitCard', () => {
  it('renders benefit title', () => {
    render(<BenefitCard benefit={mockBenefit} />)
    expect(screen.getByText('テスト補助金')).toBeInTheDocument()
  })

  it('renders benefit description', () => {
    render(<BenefitCard benefit={mockBenefit} />)
    expect(screen.getByText(/これはテスト用の補助金です/)).toBeInTheDocument()
  })

  it('displays category label for subsidy', () => {
    render(<BenefitCard benefit={mockBenefit} />)
    expect(screen.getByText('補助金')).toBeInTheDocument()
  })

  it('displays formatted amount', () => {
    render(<BenefitCard benefit={mockBenefit} />)
    expect(screen.getByText('50万円')).toBeInTheDocument()
  })

  it('displays high priority badge', () => {
    render(<BenefitCard benefit={mockBenefit} />)
    expect(screen.getByText('重要')).toBeInTheDocument()
  })

  it('displays deadline', () => {
    render(<BenefitCard benefit={mockBenefit} />)
    expect(screen.getByText(/締切: 2024-12-31/)).toBeInTheDocument()
  })

  it('displays source', () => {
    render(<BenefitCard benefit={mockBenefit} />)
    expect(screen.getByText('テスト省')).toBeInTheDocument()
  })

  it('displays medium priority badge', () => {
    const mediumPriorityBenefit: BenefitInfo = {
      ...mockBenefit,
      priority: 'medium',
    }
    render(<BenefitCard benefit={mediumPriorityBenefit} />)
    expect(screen.getByText('推奨')).toBeInTheDocument()
  })

  it('displays low priority badge', () => {
    const lowPriorityBenefit: BenefitInfo = {
      ...mockBenefit,
      priority: 'low',
    }
    render(<BenefitCard benefit={lowPriorityBenefit} />)
    expect(screen.getByText('参考')).toBeInTheDocument()
  })

  it('displays tax category label', () => {
    const taxBenefit: BenefitInfo = {
      ...mockBenefit,
      category: 'tax',
    }
    render(<BenefitCard benefit={taxBenefit} />)
    expect(screen.getByText('税制優遇')).toBeInTheDocument()
  })

  it('does not display amount when not provided', () => {
    const benefitWithoutAmount: BenefitInfo = {
      ...mockBenefit,
      amount: undefined,
    }
    render(<BenefitCard benefit={benefitWithoutAmount} />)
    expect(screen.queryByText('最大')).not.toBeInTheDocument()
  })

  it('does not display deadline when not provided', () => {
    const benefitWithoutDeadline: BenefitInfo = {
      ...mockBenefit,
      deadline: undefined,
    }
    render(<BenefitCard benefit={benefitWithoutDeadline} />)
    expect(screen.queryByText(/締切:/)).not.toBeInTheDocument()
  })

  it('renders detail button', () => {
    render(<BenefitCard benefit={mockBenefit} />)
    expect(screen.getByRole('button', { name: /詳細/ })).toBeInTheDocument()
  })
})
