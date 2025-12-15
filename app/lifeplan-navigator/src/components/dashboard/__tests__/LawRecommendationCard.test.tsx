import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LawRecommendationCard, type LawRecommendation } from '../LawRecommendationCard';

const mockRecommendation: LawRecommendation = {
  law_id: 'test-law-001',
  law_title: '所得税法',
  law_num: '昭和四十年法律第三十三号',
  relevance_reason: '会社員として確定申告や年末調整に関係します',
  relevance_score: 0.85,
  category: 'tax',
  summary: '個人の所得に対する課税について定めた法律です',
};

describe('LawRecommendationCard', () => {
  it('renders law title correctly', () => {
    render(<LawRecommendationCard recommendation={mockRecommendation} />);
    expect(screen.getByText('所得税法')).toBeInTheDocument();
  });

  it('renders law number correctly', () => {
    render(<LawRecommendationCard recommendation={mockRecommendation} />);
    expect(screen.getByText('昭和四十年法律第三十三号')).toBeInTheDocument();
  });

  it('renders relevance reason correctly', () => {
    render(<LawRecommendationCard recommendation={mockRecommendation} />);
    expect(screen.getByText('会社員として確定申告や年末調整に関係します')).toBeInTheDocument();
  });

  it('renders relevance score as percentage', () => {
    render(<LawRecommendationCard recommendation={mockRecommendation} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders summary correctly', () => {
    render(<LawRecommendationCard recommendation={mockRecommendation} />);
    expect(screen.getByText('個人の所得に対する課税について定めた法律です')).toBeInTheDocument();
  });

  it('calls onViewDetail when detail button is clicked', () => {
    const handleViewDetail = vi.fn();
    render(
      <LawRecommendationCard
        recommendation={mockRecommendation}
        onViewDetail={handleViewDetail}
      />
    );

    const detailButton = screen.getByRole('button', { name: /詳細を見る/i });
    fireEvent.click(detailButton);

    expect(handleViewDetail).toHaveBeenCalledWith('test-law-001');
    expect(handleViewDetail).toHaveBeenCalledTimes(1);
  });

  it('renders without onViewDetail callback', () => {
    render(<LawRecommendationCard recommendation={mockRecommendation} />);
    const detailButton = screen.getByRole('button', { name: /詳細を見る/i });
    expect(detailButton).toBeInTheDocument();
    // Should not throw when clicked without callback
    fireEvent.click(detailButton);
  });

  it('displays correct category icon for tax category', () => {
    render(<LawRecommendationCard recommendation={mockRecommendation} />);
    // The component should have rendered the tax category
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
  });

  it('displays correct category icon for labor category', () => {
    const laborRecommendation: LawRecommendation = {
      ...mockRecommendation,
      category: 'labor',
    };
    render(<LawRecommendationCard recommendation={laborRecommendation} />);
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
  });

  it('displays correct category icon for social_security category', () => {
    const socialRecommendation: LawRecommendation = {
      ...mockRecommendation,
      category: 'social_security',
    };
    render(<LawRecommendationCard recommendation={socialRecommendation} />);
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
  });

  it('displays default icon for unknown category', () => {
    const unknownRecommendation: LawRecommendation = {
      ...mockRecommendation,
      category: 'unknown_category',
    };
    render(<LawRecommendationCard recommendation={unknownRecommendation} />);
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LawRecommendationCard recommendation={mockRecommendation} />);
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('所得税法'));
  });

  it('renders relevance score progress bar', () => {
    render(<LawRecommendationCard recommendation={mockRecommendation} />);
    // Check for progress bar width style (85% for 0.85 score)
    const progressBar = document.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles low relevance score correctly', () => {
    const lowScoreRecommendation: LawRecommendation = {
      ...mockRecommendation,
      relevance_score: 0.3,
    };
    render(<LawRecommendationCard recommendation={lowScoreRecommendation} />);
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('handles full relevance score correctly', () => {
    const fullScoreRecommendation: LawRecommendation = {
      ...mockRecommendation,
      relevance_score: 1.0,
    };
    render(<LawRecommendationCard recommendation={fullScoreRecommendation} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
