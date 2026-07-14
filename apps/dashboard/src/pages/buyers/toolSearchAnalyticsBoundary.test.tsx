import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CompsNavigator from './CompsNavigator';
import Mandates from './Mandates';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  getCompDescriptions: vi.fn(),
  searchComps: vi.fn(),
  getRecentMandates: vi.fn(),
  searchMandates: vi.fn(),
  trackCompsSearch: vi.fn(),
  trackMandateSearchSubmitted: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'buyer-1', email: 'buyer@example.com' } }) }));
vi.mock('@/hooks/useAdminAuth', () => ({ useAdminAuth: () => ({ isAdmin: false }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/services/compsNavigatorService', () => ({
  compsNavigatorService: {
    getCompDescriptions: mocks.getCompDescriptions,
    searchComps: mocks.searchComps,
  },
}));
vi.mock('@/services/mandateService', () => ({
  mandateService: {
    getRecentMandates: mocks.getRecentMandates,
    searchMandates: mocks.searchMandates,
    deleteMandate: vi.fn(),
  },
}));
vi.mock('@/components/layout/BuyerLayout', () => ({ BuyerLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/comps-navigator/CompsNavigatorInput', () => ({ default: () => null }));
vi.mock('@/components/comps-navigator/ResultsGrid', () => ({ default: () => null }));
vi.mock('@/components/comps-navigator/SearchLoadingModal', () => ({ SearchLoadingModal: () => null }));
vi.mock('@/components/comps-navigator/SavedSearchesSidebar', () => ({ default: () => null }));
vi.mock('@/components/comps-navigator/ExamplesSection', () => ({ default: () => null }));
vi.mock('@/components/mandates/MandateSearchInput', () => ({ default: () => null }));
vi.mock('@/components/mandates/MandateExamples', () => ({ default: () => null }));
vi.mock('@/components/mandates/MandateHistorySidebar', () => ({ default: () => null }));
vi.mock('@/components/mandates/MandateResultsGrid', () => ({ default: () => null }));
vi.mock('@/components/mandates/MandateSearchLoadingModal', () => ({ default: () => null }));
vi.mock('@/utils/analytics', () => ({
  trackPageView: vi.fn(),
  trackFeatureUsage: vi.fn(),
  trackCompsSearch: mocks.trackCompsSearch,
  trackMandateSearchSubmitted: mocks.trackMandateSearchSubmitted,
  trackMandateExampleUsed: vi.fn(),
  trackSearchZeroResults: vi.fn(),
  trackSessionSearches: vi.fn(),
}));

describe('comps and mandate analytics boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCompDescriptions.mockResolvedValue({ descriptions: {}, processing_time_ms: 1 });
    mocks.searchComps.mockResolvedValue({
      results: [],
      processing_time_ms: 2,
      cost_estimate: 0,
      timing: {},
    });
    mocks.getRecentMandates.mockResolvedValue([]);
    mocks.searchMandates.mockResolvedValue({
      results: [],
      search_id: 'search-1',
      processing_time_ms: 2,
      timing: {},
    });
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits comps submission once after the accepted search completes', async () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter initialEntries={['/buyers/comps-navigator?show=Alien&show=Arrival']}>
        <CompsNavigator />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(mocks.searchComps).toHaveBeenCalledTimes(1);
    expect(mocks.trackCompsSearch).toHaveBeenCalledTimes(1);
    expect(mocks.trackCompsSearch).toHaveBeenCalledWith(2, 'comps_navigator');
  });

  it('emits no comps outcome when processing fails', async () => {
    vi.useFakeTimers();
    mocks.searchComps.mockRejectedValue(new Error('search failed'));
    render(
      <MemoryRouter initialEntries={['/buyers/comps-navigator?show=Alien']}>
        <CompsNavigator />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(mocks.trackCompsSearch).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('emits mandate submission once after the accepted search completes', async () => {
    render(
      <MemoryRouter initialEntries={['/buyers/mandates?brief=private%20mandate']}>
        <Mandates />
      </MemoryRouter>
    );

    await waitFor(() => expect(mocks.searchMandates).toHaveBeenCalledWith('private mandate', 'buyer@example.com'));
    expect(mocks.trackMandateSearchSubmitted).toHaveBeenCalledTimes(1);
    expect(mocks.trackMandateSearchSubmitted).toHaveBeenCalledWith(0, 'mandates');
  });

  it('emits no mandate outcome when processing fails', async () => {
    mocks.searchMandates.mockRejectedValue(new Error('search failed'));
    render(
      <MemoryRouter initialEntries={['/buyers/mandates?brief=private%20mandate']}>
        <Mandates />
      </MemoryRouter>
    );

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Search Failed',
      variant: 'destructive',
    })));
    expect(mocks.trackMandateSearchSubmitted).not.toHaveBeenCalled();
  });
});
