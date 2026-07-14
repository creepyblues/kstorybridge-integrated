import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Titles from './Titles';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  searchTitlesHybrid: vi.fn(),
  getTitlesPaginated: vi.fn(),
  getTitlesByIds: vi.fn(),
  trackTitleSearch: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/services/titlesService', () => ({
  titlesService: {
    searchTitlesHybrid: mocks.searchTitlesHybrid,
    getTitlesPaginated: mocks.getTitlesPaginated,
    getTitlesByIds: mocks.getTitlesByIds,
  },
}));
vi.mock('@/services/formatFitService', () => ({
  formatFitService: {
    getTitlesForFormat: vi.fn(),
    getFormatFitSummariesForFormat: vi.fn(),
  },
}));
vi.mock('@/components/layout/BuyerLayout', () => ({ BuyerLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/title/TitleCard', () => ({ TitleCard: () => null }));
vi.mock('@/utils/analytics', () => ({
  trackTitleSearch: mocks.trackTitleSearch,
  trackFeatureUsage: vi.fn(),
  trackPageView: vi.fn(),
  trackSearchZeroResults: vi.fn(),
  trackTitlesFilterApplied: vi.fn(),
  trackSessionSearches: vi.fn(),
}));

const settleInitialLoad = async () => {
  render(<Titles />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};

describe('title search analytics boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.getTitlesPaginated.mockResolvedValue({ data: [], hasMore: false });
    mocks.searchTitlesHybrid.mockResolvedValue({ nameMatches: [], vectorPromise: Promise.resolve([]) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits once after the deliberate hybrid request is accepted', async () => {
    await settleInitialLoad();
    fireEvent.change(screen.getByPlaceholderText(/search titles/i), { target: { value: 'private query' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mocks.searchTitlesHybrid).toHaveBeenCalledWith('private query', 50);
    expect(mocks.trackTitleSearch).toHaveBeenCalledTimes(1);
    expect(mocks.trackTitleSearch).toHaveBeenCalledWith('hybrid', 0);
  });

  it('emits no submitted outcome when the search request is rejected', async () => {
    mocks.searchTitlesHybrid.mockRejectedValue(new Error('request rejected'));
    await settleInitialLoad();
    fireEvent.change(screen.getByPlaceholderText(/search titles/i), { target: { value: 'private query' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mocks.trackTitleSearch).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });
});
