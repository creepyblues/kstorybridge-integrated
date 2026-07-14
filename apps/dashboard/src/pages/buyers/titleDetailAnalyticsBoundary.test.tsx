import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UnifiedTitleDetailPage from './UnifiedTitleDetailPage';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  getTitleBySlug: vi.fn(),
  isFavorited: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getFavorites: vi.fn(),
  trackTitleDetailView: vi.fn(),
  trackFavorite: vi.fn(),
  trackFeatureUsage: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'buyer-1', email: 'buyer@example.com', user_metadata: {} },
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/contexts/TierContext', () => ({ useTierAccess: () => ({ tier: 'pro' }) }));
vi.mock('@/services/titlesService', () => ({
  titlesService: {
    getTitleBySlug: mocks.getTitleBySlug,
    isFavorited: mocks.isFavorited,
    addFavorite: mocks.addFavorite,
    removeFavorite: mocks.removeFavorite,
    getFavorites: mocks.getFavorites,
  },
}));
vi.mock('@/components/layout/BuyerLayout', () => ({ BuyerLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/unified-title-detail', () => ({
  UnifiedTitleDetail: ({ isFavorited, onFavoriteToggle }: { isFavorited: boolean; onFavoriteToggle: () => void }) => (
    <button onClick={onFavoriteToggle}>{isFavorited ? 'Remove favorite' : 'Add favorite'}</button>
  ),
}));
vi.mock('@/utils/analytics', () => ({
  trackTitleDetailView: mocks.trackTitleDetailView,
  trackFavorite: mocks.trackFavorite,
  trackFeatureUsage: mocks.trackFeatureUsage,
}));
vi.mock('@/utils/onboarding', () => ({ completeOnboardingStep: vi.fn() }));
vi.mock('@/services/emailService', () => ({ triggerFirstSaveEmail: vi.fn().mockResolvedValue(undefined) }));

const title = {
  title_id: 'title-1',
  title_name_en: 'Sensitive title name',
  title_name_kr: '민감한 제목',
  slug: 'test-title',
  genre: ['Drama'],
};

const renderPage = (from = 'search') => render(
  <MemoryRouter initialEntries={[{ pathname: '/buyers/titles/test-title', state: { from } }]}>
    <Routes>
      <Route path="/buyers/titles/:slug" element={<UnifiedTitleDetailPage />} />
    </Routes>
  </MemoryRouter>
);

describe('title detail and favorite analytics boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTitleBySlug.mockResolvedValue(title);
    mocks.isFavorited.mockResolvedValue(false);
    mocks.addFavorite.mockResolvedValue(undefined);
    mocks.removeFavorite.mockResolvedValue(undefined);
    mocks.getFavorites.mockResolvedValue([]);
  });

  it('emits one detail view only after a valid title resolves', async () => {
    renderPage();

    await screen.findByRole('button', { name: /add favorite/i });
    expect(mocks.trackTitleDetailView).toHaveBeenCalledTimes(1);
    expect(mocks.trackTitleDetailView).toHaveBeenCalledWith('title-1', 'search');
  });

  it('emits no detail view when the title does not exist', async () => {
    mocks.getTitleBySlug.mockResolvedValue(null);
    renderPage();

    await screen.findByText(/title not found/i);
    expect(mocks.trackTitleDetailView).not.toHaveBeenCalled();
  });

  it('emits favorite_added once after the save succeeds', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /add favorite/i }));

    await waitFor(() => expect(mocks.addFavorite).toHaveBeenCalledWith('title-1', 'buyer-1'));
    expect(mocks.trackFavorite).toHaveBeenCalledTimes(1);
    expect(mocks.trackFavorite).toHaveBeenCalledWith('add', 'title-1', 'title_detail');
  });

  it('emits no favorite outcome when the save fails', async () => {
    mocks.addFavorite.mockRejectedValue(new Error('write failed'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /add favorite/i }));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
    expect(mocks.trackFavorite).not.toHaveBeenCalled();
  });

  it('emits favorite_removed once after deletion succeeds', async () => {
    mocks.isFavorited.mockResolvedValue(true);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /remove favorite/i }));

    await waitFor(() => expect(mocks.removeFavorite).toHaveBeenCalledWith('title-1', 'buyer-1'));
    expect(mocks.trackFavorite).toHaveBeenCalledTimes(1);
    expect(mocks.trackFavorite).toHaveBeenCalledWith('remove', 'title-1', 'title_detail');
  });
});
