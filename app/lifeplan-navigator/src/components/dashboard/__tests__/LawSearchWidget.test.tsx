import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LawSearchWidget } from '../LawSearchWidget';

describe('LawSearchWidget', () => {
  describe('Basic Rendering', () => {
    it('renders search input correctly', () => {
      render(<LawSearchWidget onSearch={vi.fn()} />);
      const input = screen.getByRole('textbox', { name: /法令検索/i });
      expect(input).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          placeholder="カスタムプレースホルダー"
        />
      );
      const input = screen.getByPlaceholderText('カスタムプレースホルダー');
      expect(input).toBeInTheDocument();
    });

    it('renders with default placeholder when not specified', () => {
      render(<LawSearchWidget onSearch={vi.fn()} />);
      const input = screen.getByPlaceholderText('法令を検索...');
      expect(input).toBeInTheDocument();
    });

    it('renders search button', () => {
      render(<LawSearchWidget onSearch={vi.fn()} />);
      const button = screen.getByRole('button', { name: /検索実行/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onSearch with query when form is submitted', async () => {
      const handleSearch = vi.fn();
      render(<LawSearchWidget onSearch={handleSearch} />);

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      await userEvent.type(input, '所得税法');

      const form = input.closest('form');
      fireEvent.submit(form!);

      expect(handleSearch).toHaveBeenCalledWith('所得税法');
    });

    it('trims whitespace from query before search', async () => {
      const handleSearch = vi.fn();
      render(<LawSearchWidget onSearch={handleSearch} />);

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      await userEvent.type(input, '  所得税法  ');

      const form = input.closest('form');
      fireEvent.submit(form!);

      expect(handleSearch).toHaveBeenCalledWith('所得税法');
    });

    it('does not call onSearch when query is empty', async () => {
      const handleSearch = vi.fn();
      render(<LawSearchWidget onSearch={handleSearch} />);

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      const form = input.closest('form');
      fireEvent.submit(form!);

      expect(handleSearch).not.toHaveBeenCalled();
    });

    it('does not call onSearch when query is only whitespace', async () => {
      const handleSearch = vi.fn();
      render(<LawSearchWidget onSearch={handleSearch} />);

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      await userEvent.type(input, '   ');

      const form = input.closest('form');
      fireEvent.submit(form!);

      expect(handleSearch).not.toHaveBeenCalled();
    });
  });

  describe('Suggestions Dropdown', () => {
    it('shows suggestions dropdown when focused with suggestions', async () => {
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          suggestions={['所得税', '法人税', '消費税']}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('おすすめキーワード')).toBeInTheDocument();
      });
    });

    it('displays suggestion items', async () => {
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          suggestions={['所得税', '法人税', '消費税']}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('所得税')).toBeInTheDocument();
        expect(screen.getByText('法人税')).toBeInTheDocument();
        expect(screen.getByText('消費税')).toBeInTheDocument();
      });
    });

    it('calls onSearch when suggestion is clicked', async () => {
      const handleSearch = vi.fn();
      render(
        <LawSearchWidget
          onSearch={handleSearch}
          suggestions={['所得税', '法人税', '消費税']}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        const suggestion = screen.getByText('所得税');
        fireEvent.click(suggestion);
      });

      expect(handleSearch).toHaveBeenCalledWith('所得税');
    });

    it('limits displayed suggestions to 6', async () => {
      const manySuggestions = [
        '所得税', '法人税', '消費税', '相続税', '贈与税', '固定資産税', '自動車税', '住民税'
      ];
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          suggestions={manySuggestions}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('所得税')).toBeInTheDocument();
        expect(screen.getByText('固定資産税')).toBeInTheDocument();
        expect(screen.queryByText('自動車税')).not.toBeInTheDocument();
        expect(screen.queryByText('住民税')).not.toBeInTheDocument();
      });
    });
  });

  describe('Recent Searches', () => {
    it('shows recent searches section when provided', async () => {
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          recentSearches={['労働基準法', '民法']}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('最近の検索')).toBeInTheDocument();
      });
    });

    it('displays recent search items', async () => {
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          recentSearches={['労働基準法', '民法']}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('労働基準法')).toBeInTheDocument();
        expect(screen.getByText('民法')).toBeInTheDocument();
      });
    });

    it('calls onSearch when recent search is clicked', async () => {
      const handleSearch = vi.fn();
      render(
        <LawSearchWidget
          onSearch={handleSearch}
          recentSearches={['労働基準法', '民法']}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        const recentItem = screen.getByText('労働基準法');
        fireEvent.click(recentItem);
      });

      expect(handleSearch).toHaveBeenCalledWith('労働基準法');
    });

    it('limits displayed recent searches to 5', async () => {
      const manySearches = ['検索1', '検索2', '検索3', '検索4', '検索5', '検索6', '検索7'];
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          recentSearches={manySearches}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('検索1')).toBeInTheDocument();
        expect(screen.getByText('検索5')).toBeInTheDocument();
        expect(screen.queryByText('検索6')).not.toBeInTheDocument();
        expect(screen.queryByText('検索7')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dropdown Visibility', () => {
    it('does not show dropdown when not focused', () => {
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          suggestions={['所得税']}
          recentSearches={['民法']}
        />
      );

      expect(screen.queryByText('おすすめキーワード')).not.toBeInTheDocument();
      expect(screen.queryByText('最近の検索')).not.toBeInTheDocument();
    });

    it('does not show dropdown when empty suggestions and searches', async () => {
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          suggestions={[]}
          recentSearches={[]}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      // Wait a bit to ensure dropdown would have appeared
      await waitFor(() => {
        expect(screen.queryByText('おすすめキーワード')).not.toBeInTheDocument();
        expect(screen.queryByText('最近の検索')).not.toBeInTheDocument();
      });
    });

    it('shows both sections when both are provided', async () => {
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          suggestions={['所得税']}
          recentSearches={['民法']}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByText('おすすめキーワード')).toBeInTheDocument();
        expect(screen.getByText('最近の検索')).toBeInTheDocument();
      });
    });
  });

  describe('Input State', () => {
    it('updates input value when typing', async () => {
      render(<LawSearchWidget onSearch={vi.fn()} />);

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      await userEvent.type(input, '検索クエリ');

      expect(input).toHaveValue('検索クエリ');
    });

    it('updates input when suggestion is clicked', async () => {
      render(
        <LawSearchWidget
          onSearch={vi.fn()}
          suggestions={['所得税法']}
        />
      );

      const input = screen.getByRole('textbox', { name: /法令検索/i });
      fireEvent.focus(input);

      await waitFor(() => {
        const suggestion = screen.getByText('所得税法');
        fireEvent.click(suggestion);
      });

      expect(input).toHaveValue('所得税法');
    });
  });
});
