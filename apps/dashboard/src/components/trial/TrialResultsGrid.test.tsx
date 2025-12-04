import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TrialResultsGrid } from './TrialResultsGrid';
import { TitleMatch } from '@/services/compsNavigatorService';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockResults: TitleMatch[] = [
  {
    title_id: 'test-1',
    title_name_en: 'Test Title English',
    title_name_kr: '테스트 타이틀',
    synopsis: 'This is a test synopsis for the title',
    genre: ['Action', 'Drama', 'Romance'],
    tone: 'Dark',
    title_image: 'https://example.com/image.jpg',
    match_score: 85,
    explanation: 'This title matches because of similar themes and tone',
  },
  {
    title_id: 'test-2',
    title_name_en: 'Another Title',
    title_name_kr: '다른 타이틀',
    synopsis: 'Another test synopsis',
    genre: ['Comedy', 'Slice of Life'],
    tone: 'Light',
    title_image: undefined,
    match_score: 72,
    explanation: 'Good match for comedy elements',
  },
];

function renderGrid(results: TitleMatch[] = mockResults, isLoading = false) {
  return render(
    <BrowserRouter>
      <TrialResultsGrid results={results} isLoading={isLoading} />
    </BrowserRouter>
  );
}

describe('TrialResultsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      renderGrid([], true);
      expect(screen.getByText('Searching for matches...')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no results and not loading', () => {
      renderGrid([], false);
      expect(screen.getByText('No results yet')).toBeInTheDocument();
      expect(screen.getByText('Add comps and click "Find Matches" to search')).toBeInTheDocument();
    });
  });

  describe('results display', () => {
    it('should show correct match count', () => {
      renderGrid();
      expect(screen.getByText('2 Matches Found')).toBeInTheDocument();
    });

    it('should show "Match" (singular) when 1 result', () => {
      renderGrid([mockResults[0]]);
      expect(screen.getByText('1 Match Found')).toBeInTheDocument();
    });

    it('should display title names', () => {
      renderGrid();
      expect(screen.getByText('Test Title English')).toBeInTheDocument();
      expect(screen.getByText('Another Title')).toBeInTheDocument();
    });

    it('should display Korean names as subtitles', () => {
      renderGrid();
      expect(screen.getByText('테스트 타이틀')).toBeInTheDocument();
    });

    it('should display match scores', () => {
      renderGrid();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
    });

    it('should display genre tags', () => {
      renderGrid();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Drama')).toBeInTheDocument();
    });

    it('should display explanations', () => {
      renderGrid();
      expect(screen.getByText('This title matches because of similar themes and tone')).toBeInTheDocument();
    });
  });

  describe('match score badge colors', () => {
    it('should use emerald colors for high scores (85+)', () => {
      renderGrid([{ ...mockResults[0], match_score: 90 }]);
      const badge = screen.getByText('90%');
      expect(badge.className).toContain('from-emerald');
    });

    it('should use blue colors for medium scores (70-84)', () => {
      renderGrid([{ ...mockResults[0], match_score: 75 }]);
      const badge = screen.getByText('75%');
      expect(badge.className).toContain('from-blue');
    });

    it('should use purple colors for lower scores (<70)', () => {
      renderGrid([{ ...mockResults[0], match_score: 65 }]);
      const badge = screen.getByText('65%');
      expect(badge.className).toContain('from-purple');
    });
  });

  describe('card interactions', () => {
    it('should open modal when card is clicked', () => {
      renderGrid();
      const card = screen.getByText('Test Title English').closest('[class*="cursor-pointer"]');
      fireEvent.click(card!);

      // Modal should show with "View Full Title Details" button
      expect(screen.getByText('View Full Title Details')).toBeInTheDocument();
    });
  });

  describe('modal navigation', () => {
    it('should navigate to trial title detail when View Full Title Details is clicked', () => {
      renderGrid();

      // Open modal
      const card = screen.getByText('Test Title English').closest('[class*="cursor-pointer"]');
      fireEvent.click(card!);

      // Click view details button
      const viewButton = screen.getByText('View Full Title Details');
      fireEvent.click(viewButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trial/titles/test-1');
    });
  });
});
