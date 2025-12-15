import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextActionCard, type NextAction } from '../NextActionCard';

const mockHighPriorityAction: NextAction = {
  id: 'action-001',
  title: '年末調整の準備を始めましょう',
  description: '会社員の方は、年末調整の書類提出が必要です。',
  priority: 'high',
  dueDate: '2025-12-20',
  relatedLaw: '所得税法',
  steps: [
    '扶養控除申告書を確認',
    '保険料控除証明書を収集',
    '住宅ローン控除の書類準備',
  ],
};

const mockMediumPriorityAction: NextAction = {
  id: 'action-002',
  title: '住宅購入の資金計画',
  description: '住宅購入を検討中の方は、住宅ローン控除などの制度を確認しましょう。',
  priority: 'medium',
  relatedLaw: '租税特別措置法',
  steps: [
    '住宅ローン控除の条件確認',
    '頭金の計画',
  ],
};

const mockLowPriorityAction: NextAction = {
  id: 'action-003',
  title: '年金記録の確認',
  description: '定期的に年金記録を確認することをお勧めします。',
  priority: 'low',
};

describe('NextActionCard', () => {
  describe('Basic Rendering', () => {
    it('renders action title correctly', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      expect(screen.getByText('年末調整の準備を始めましょう')).toBeInTheDocument();
    });

    it('renders action description correctly', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      expect(screen.getByText('会社員の方は、年末調整の書類提出が必要です。')).toBeInTheDocument();
    });

    it('renders related law when provided', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      expect(screen.getByText(/所得税法/)).toBeInTheDocument();
    });

    it('renders steps when provided', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      expect(screen.getByText('扶養控除申告書を確認')).toBeInTheDocument();
      expect(screen.getByText('保険料控除証明書を収集')).toBeInTheDocument();
      expect(screen.getByText('住宅ローン控除の書類準備')).toBeInTheDocument();
    });

    it('does not render steps section when not provided', () => {
      render(<NextActionCard action={mockLowPriorityAction} />);
      expect(screen.queryByText('ステップ:')).not.toBeInTheDocument();
    });

    it('does not render related law section when not provided', () => {
      render(<NextActionCard action={mockLowPriorityAction} />);
      expect(screen.queryByText(/関連法令:/)).not.toBeInTheDocument();
    });
  });

  describe('Priority Display', () => {
    it('displays HIGH badge for high priority actions', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });

    it('displays MEDIUM badge for medium priority actions', () => {
      render(<NextActionCard action={mockMediumPriorityAction} />);
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('displays LOW badge for low priority actions', () => {
      render(<NextActionCard action={mockLowPriorityAction} />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('applies red styling for high priority', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      const badge = screen.getByText('HIGH');
      expect(badge.className).toContain('bg-red');
    });

    it('applies yellow styling for medium priority', () => {
      render(<NextActionCard action={mockMediumPriorityAction} />);
      const badge = screen.getByText('MEDIUM');
      expect(badge.className).toContain('bg-yellow');
    });

    it('applies green styling for low priority', () => {
      render(<NextActionCard action={mockLowPriorityAction} />);
      const badge = screen.getByText('LOW');
      expect(badge.className).toContain('bg-green');
    });
  });

  describe('Due Date Display', () => {
    it('renders due date when provided', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      // The date should be formatted in Japanese locale
      expect(screen.getByText(/期限:/)).toBeInTheDocument();
    });

    it('does not render due date section when not provided', () => {
      render(<NextActionCard action={mockLowPriorityAction} />);
      expect(screen.queryByText(/期限:/)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onComplete when complete button is clicked', () => {
      const handleComplete = vi.fn();
      render(
        <NextActionCard action={mockHighPriorityAction} onComplete={handleComplete} />
      );

      const completeButton = screen.getByRole('button', { name: /完了/i });
      fireEvent.click(completeButton);

      expect(handleComplete).toHaveBeenCalledWith('action-001');
      expect(handleComplete).toHaveBeenCalledTimes(1);
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const handleDismiss = vi.fn();
      render(
        <NextActionCard action={mockHighPriorityAction} onDismiss={handleDismiss} />
      );

      const dismissButton = screen.getByRole('button', { name: /後で確認/i });
      fireEvent.click(dismissButton);

      expect(handleDismiss).toHaveBeenCalledWith('action-001');
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not throw when complete button clicked without callback', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      const completeButton = screen.getByRole('button', { name: /完了/i });
      expect(() => fireEvent.click(completeButton)).not.toThrow();
    });

    it('does not throw when dismiss button clicked without callback', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      const dismissButton = screen.getByRole('button', { name: /後で確認/i });
      expect(() => fireEvent.click(dismissButton)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper article role', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });

    it('has proper aria-label on card', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('年末調整'));
    });

    it('has accessible button labels for complete action', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      const completeButton = screen.getByRole('button', { name: /完了としてマーク/i });
      expect(completeButton).toBeInTheDocument();
    });

    it('has accessible button labels for dismiss action', () => {
      render(<NextActionCard action={mockHighPriorityAction} />);
      const dismissButton = screen.getByRole('button', { name: /後で確認/i });
      expect(dismissButton).toBeInTheDocument();
    });
  });
});
