import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Chat from './Chat';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  createSession: vi.fn(),
  recordMessage: vi.fn(),
  sendMessage: vi.fn(),
  trackChatMessageSent: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'buyer-1', email: 'buyer@example.com' } }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: () => ({
          order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
        }),
      }),
    }),
  },
}));
vi.mock('@/services/chatHistoryService', () => ({
  chatHistoryService: {
    createSession: mocks.createSession,
    recordMessage: mocks.recordMessage,
    recordRecommendations: vi.fn(),
    recordSuggestedQueries: vi.fn(),
    getSessionMessagesWithData: vi.fn().mockResolvedValue([]),
    markQueryAsClicked: vi.fn(),
    recordInteraction: vi.fn(),
  },
}));
vi.mock('@/services/chatOrchestratorService', () => ({
  chatOrchestratorService: {
    getSuggestedQueries: () => [],
    sendMessage: mocks.sendMessage,
  },
}));
vi.mock('@/components/layout/BuyerLayout', () => ({ BuyerLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/chat/ChatEmptyState', () => ({ ChatEmptyState: () => null }));
vi.mock('@/components/chat/ChatMessage', () => ({ ChatMessage: () => null }));
vi.mock('@/components/chat/ConversationalMessage', () => ({ ConversationalMessage: () => null }));
vi.mock('@/components/chat/ChatInput', () => ({ ChatInput: () => null }));
vi.mock('@/components/chat/ChatHistorySidebar', () => ({ default: () => null }));
vi.mock('@/components/chat/ChatProcessingStatus', () => ({ default: () => null }));
vi.mock('@/components/title/TitleCard', () => ({ TitleCard: () => null }));
vi.mock('@/components/chat/SuggestedQueries', () => ({ SuggestedQueries: () => null }));
vi.mock('@/utils/analytics', () => ({
  trackPageView: vi.fn(),
  trackFeatureUsage: vi.fn(),
  trackChatMessageSent: mocks.trackChatMessageSent,
  trackChatSessionStarted: vi.fn(),
  trackChatHistoryLoaded: vi.fn(),
  trackChatSuggestionClick: vi.fn(),
  trackSessionSearches: vi.fn(),
}));

const renderWithQuery = () => render(
  <MemoryRouter initialEntries={['/buyers/chat?q=private%20message']}>
    <Chat />
  </MemoryRouter>
);

describe('chat message analytics boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { value: vi.fn(), configurable: true });
    mocks.createSession.mockResolvedValue({ id: 'session-1' });
    mocks.recordMessage
      .mockResolvedValueOnce({ id: 'user-message-1' })
      .mockResolvedValueOnce({ id: 'bot-message-1' });
    mocks.sendMessage.mockResolvedValue({
      response: 'Response',
      titles: [],
      suggestedQueries: [],
      explanations: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits once after validation and durable session creation', async () => {
    renderWithQuery();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    await vi.waitFor(() => expect(mocks.trackChatMessageSent).toHaveBeenCalledTimes(1));
    expect(mocks.trackChatMessageSent).toHaveBeenCalledWith('url_param', 'private message'.length);
  });

  it('emits no submitted outcome when session creation fails', async () => {
    mocks.createSession.mockRejectedValue(new Error('session failed'));
    renderWithQuery();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    await vi.waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
    expect(mocks.trackChatMessageSent).not.toHaveBeenCalled();
  });
});
