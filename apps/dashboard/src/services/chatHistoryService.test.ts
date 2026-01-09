/**
 * ChatHistoryService Unit Tests
 *
 * Tests for chat session, message, recommendation, and interaction management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chatHistoryService, ChatSession, ChatMessage, CreateSessionData } from './chatHistoryService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Suppress console logs during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Helper to create mock query builder
function createMockQueryBuilder(
  returnValue: { data?: unknown; error?: unknown; count?: number | null } = { data: null, error: null }
) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
    maybeSingle: vi.fn().mockResolvedValue(returnValue),
    then: (resolve: (value: typeof returnValue) => void) => Promise.resolve(resolve(returnValue)),
  };

  // Make builder thenable
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: typeof returnValue) => void) => Promise.resolve(resolve(returnValue)),
    configurable: true,
  });

  return builder;
}

describe('ChatHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock auth.getUser to return a user
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } as any },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSession: ChatSession = {
    id: 'session-1',
    user_id: 'user-1',
    user_email: 'test@example.com',
    session_type: 'openai',
    started_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockMessage: ChatMessage = {
    id: 'msg-1',
    session_id: 'session-1',
    user_id: 'user-1',
    message_type: 'user_prompt',
    content: 'Hello, I need help finding titles',
    created_at: new Date().toISOString(),
  };

  describe('Session Management', () => {
    describe('createSession', () => {
      it('should create a new session successfully', async () => {
        const mockBuilder = createMockQueryBuilder({ data: mockSession, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const sessionData: CreateSessionData = {
          user_id: 'user-1',
          user_email: 'test@example.com',
          session_type: 'openai',
        };

        const result = await chatHistoryService.createSession(sessionData);

        expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
        expect(mockBuilder.insert).toHaveBeenCalled();
        expect(result).toEqual(mockSession);
      });

      it('should return null on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.createSession({
          user_id: 'user-1',
          user_email: 'test@example.com',
          session_type: 'openai',
        });

        expect(result).toBeNull();
      });
    });

    describe('endSession', () => {
      it('should end a session successfully', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.endSession('session-1');

        expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
        expect(mockBuilder.update).toHaveBeenCalled();
        expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'session-1');
        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.endSession('session-1');

        expect(result).toBe(false);
      });
    });

    describe('getSession', () => {
      it('should fetch a session by ID', async () => {
        const mockBuilder = createMockQueryBuilder({ data: mockSession, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getSession('session-1');

        expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
        expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'session-1');
        expect(result).toEqual(mockSession);
      });

      it('should return null when session not found', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getSession('nonexistent');

        expect(result).toBeNull();
      });

      it('should return null on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Fetch failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getSession('session-1');

        expect(result).toBeNull();
      });
    });

    describe('getUserSessions', () => {
      it('should fetch user sessions', async () => {
        const mockBuilder = createMockQueryBuilder({ data: [mockSession], error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getUserSessions('user-1');

        expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
        expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(mockBuilder.limit).toHaveBeenCalledWith(50);
        expect(result).toEqual([mockSession]);
      });

      it('should respect custom limit', async () => {
        const mockBuilder = createMockQueryBuilder({ data: [], error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        await chatHistoryService.getUserSessions('user-1', 10);

        expect(mockBuilder.limit).toHaveBeenCalledWith(10);
      });

      it('should return empty array on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Fetch failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getUserSessions('user-1');

        expect(result).toEqual([]);
      });
    });

    describe('deleteSession', () => {
      it('should delete a session successfully', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.deleteSession('session-1');

        expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
        expect(mockBuilder.delete).toHaveBeenCalled();
        expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'session-1');
        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.deleteSession('session-1');

        expect(result).toBe(false);
      });
    });
  });

  describe('Message Management', () => {
    describe('recordMessage', () => {
      it('should record a message successfully', async () => {
        const mockBuilder = createMockQueryBuilder({ data: mockMessage, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.recordMessage({
          session_id: 'session-1',
          user_id: 'user-1',
          message_type: 'user_prompt',
          content: 'Hello, I need help',
        });

        expect(supabase.from).toHaveBeenCalledWith('chat_messages');
        expect(mockBuilder.insert).toHaveBeenCalled();
        expect(result).toEqual(mockMessage);
      });

      it('should include optional fields', async () => {
        const mockBuilder = createMockQueryBuilder({ data: mockMessage, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        await chatHistoryService.recordMessage({
          session_id: 'session-1',
          user_id: 'user-1',
          message_type: 'ai_response',
          content: 'Here are some titles',
          tokens_used: 150,
          response_time_ms: 500,
        });

        expect(mockBuilder.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            tokens_used: 150,
            response_time_ms: 500,
          })
        );
      });

      it('should return null on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.recordMessage({
          session_id: 'session-1',
          user_id: 'user-1',
          message_type: 'user_prompt',
          content: 'Hello',
        });

        expect(result).toBeNull();
      });
    });

    describe('getSessionMessages', () => {
      it('should fetch session messages', async () => {
        const mockBuilder = createMockQueryBuilder({ data: [mockMessage], error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getSessionMessages('session-1');

        expect(supabase.from).toHaveBeenCalledWith('chat_messages');
        expect(mockBuilder.eq).toHaveBeenCalledWith('session_id', 'session-1');
        expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true });
        expect(result).toEqual([mockMessage]);
      });

      it('should return empty array on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Fetch failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getSessionMessages('session-1');

        expect(result).toEqual([]);
      });
    });

    describe('getMessageRecommendations', () => {
      const mockRecommendation = {
        id: 'rec-1',
        message_id: 'msg-1',
        session_id: 'session-1',
        title_id: 'title-1',
        title_name_en: 'Romance in Seoul',
        recommendation_score: 0.9,
        created_at: new Date().toISOString(),
      };

      it('should fetch message recommendations', async () => {
        const mockBuilder = createMockQueryBuilder({ data: [mockRecommendation], error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getMessageRecommendations('msg-1');

        expect(supabase.from).toHaveBeenCalledWith('chat_title_recommendations');
        expect(mockBuilder.eq).toHaveBeenCalledWith('message_id', 'msg-1');
        expect(mockBuilder.order).toHaveBeenCalledWith('recommendation_score', { ascending: false });
        expect(result).toEqual([mockRecommendation]);
      });

      it('should return empty array on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Fetch failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getMessageRecommendations('msg-1');

        expect(result).toEqual([]);
      });
    });

    describe('getMessageSuggestedQueries', () => {
      const mockQuery = {
        id: 'query-1',
        message_id: 'msg-1',
        session_id: 'session-1',
        suggested_query: 'romantic comedies',
        query_position: 1,
        clicked: false,
        created_at: new Date().toISOString(),
      };

      it('should fetch suggested queries', async () => {
        const mockBuilder = createMockQueryBuilder({ data: [mockQuery], error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getMessageSuggestedQueries('msg-1');

        expect(supabase.from).toHaveBeenCalledWith('chat_suggested_queries');
        expect(mockBuilder.eq).toHaveBeenCalledWith('message_id', 'msg-1');
        expect(result).toEqual([mockQuery]);
      });

      it('should return empty array on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Fetch failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getMessageSuggestedQueries('msg-1');

        expect(result).toEqual([]);
      });
    });
  });

  describe('Recommendations', () => {
    describe('recordRecommendations', () => {
      it('should record recommendations successfully', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const recommendations = [
          {
            message_id: 'msg-1',
            session_id: 'session-1',
            title_id: 'title-1',
            title_name_en: 'Test Title',
            recommendation_score: 0.85,
          },
        ];

        const result = await chatHistoryService.recordRecommendations(recommendations);

        expect(supabase.from).toHaveBeenCalledWith('chat_title_recommendations');
        expect(mockBuilder.insert).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.recordRecommendations([
          {
            message_id: 'msg-1',
            session_id: 'session-1',
            title_id: 'title-1',
          },
        ]);

        expect(result).toBe(false);
      });
    });
  });

  describe('Interactions', () => {
    describe('recordInteraction', () => {
      it('should record an interaction successfully', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.recordInteraction({
          session_id: 'session-1',
          user_id: 'user-1',
          interaction_type: 'title_click',
          target_id: 'title-1',
          target_title: 'Test Title',
        });

        expect(supabase.from).toHaveBeenCalledWith('chat_interactions');
        expect(mockBuilder.insert).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.recordInteraction({
          session_id: 'session-1',
          user_id: 'user-1',
          interaction_type: 'title_click',
        });

        expect(result).toBe(false);
      });
    });

    describe('getSessionInteractions', () => {
      const mockInteraction = {
        id: 'int-1',
        session_id: 'session-1',
        user_id: 'user-1',
        interaction_type: 'title_click',
        target_id: 'title-1',
        created_at: new Date().toISOString(),
      };

      it('should fetch session interactions', async () => {
        const mockBuilder = createMockQueryBuilder({ data: [mockInteraction], error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getSessionInteractions('session-1');

        expect(supabase.from).toHaveBeenCalledWith('chat_interactions');
        expect(mockBuilder.eq).toHaveBeenCalledWith('session_id', 'session-1');
        expect(result).toEqual([mockInteraction]);
      });

      it('should return empty array on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Fetch failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getSessionInteractions('session-1');

        expect(result).toEqual([]);
      });
    });
  });

  describe('Suggested Queries', () => {
    describe('recordSuggestedQueries', () => {
      it('should record suggested queries successfully', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const queries = [
          {
            message_id: 'msg-1',
            session_id: 'session-1',
            suggested_query: 'romantic comedies',
            query_position: 1,
          },
          {
            message_id: 'msg-1',
            session_id: 'session-1',
            suggested_query: 'action thrillers',
            query_position: 2,
          },
        ];

        const result = await chatHistoryService.recordSuggestedQueries(queries);

        expect(supabase.from).toHaveBeenCalledWith('chat_suggested_queries');
        expect(mockBuilder.insert).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.recordSuggestedQueries([
          {
            message_id: 'msg-1',
            session_id: 'session-1',
            suggested_query: 'test',
            query_position: 1,
          },
        ]);

        expect(result).toBe(false);
      });
    });

    describe('markQueryAsClicked', () => {
      it('should mark query as clicked', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.markQueryAsClicked('msg-1', 'romantic comedies');

        expect(supabase.from).toHaveBeenCalledWith('chat_suggested_queries');
        expect(mockBuilder.update).toHaveBeenCalledWith({ clicked: true });
        expect(mockBuilder.eq).toHaveBeenCalledWith('message_id', 'msg-1');
        expect(mockBuilder.eq).toHaveBeenCalledWith('suggested_query', 'romantic comedies');
        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.markQueryAsClicked('msg-1', 'test');

        expect(result).toBe(false);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('getActiveSession', () => {
      it('should return active session', async () => {
        const recentSession = {
          ...mockSession,
          started_at: new Date().toISOString(), // Fresh session
        };
        const mockBuilder = createMockQueryBuilder({ data: recentSession, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getActiveSession('user-1', 'openai');

        expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
        expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(mockBuilder.eq).toHaveBeenCalledWith('session_type', 'openai');
        expect(mockBuilder.is).toHaveBeenCalledWith('ended_at', null);
        expect(result).toEqual(recentSession);
      });

      it('should return null for expired session', async () => {
        const expiredDate = new Date();
        expiredDate.setHours(expiredDate.getHours() - 25); // 25 hours ago (> 24h expiry)
        const expiredSession = {
          ...mockSession,
          started_at: expiredDate.toISOString(),
        };
        const mockBuilder = createMockQueryBuilder({ data: expiredSession, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getActiveSession('user-1', 'openai');

        expect(result).toBeNull();
      });

      it('should return null when no active session', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getActiveSession('user-1', 'openai');

        expect(result).toBeNull();
      });

      it('should return null on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getActiveSession('user-1', 'openai');

        expect(result).toBeNull();
      });
    });

    describe('cleanupOldSessions', () => {
      it('should cleanup old sessions', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.cleanupOldSessions(30);

        expect(supabase.from).toHaveBeenCalledWith('chat_sessions');
        expect(mockBuilder.delete).toHaveBeenCalled();
        expect(mockBuilder.lt).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.cleanupOldSessions();

        expect(result).toBe(false);
      });
    });

    describe('validateSession', () => {
      it('should return true for valid session', async () => {
        const recentSession = {
          ...mockSession,
          started_at: new Date().toISOString(),
          ended_at: null,
        };
        const mockBuilder = createMockQueryBuilder({ data: recentSession, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.validateSession('session-1', 'user-1');

        expect(result).toBe(true);
      });

      it('should return false for session not found', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.validateSession('nonexistent', 'user-1');

        expect(result).toBe(false);
      });

      it('should return false for different user', async () => {
        const sessionOtherUser = {
          ...mockSession,
          user_id: 'other-user',
          started_at: new Date().toISOString(),
        };
        const mockBuilder = createMockQueryBuilder({ data: sessionOtherUser, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.validateSession('session-1', 'user-1');

        expect(result).toBe(false);
      });

      it('should return false for ended session', async () => {
        const endedSession = {
          ...mockSession,
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
        };
        const mockBuilder = createMockQueryBuilder({ data: endedSession, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.validateSession('session-1', 'user-1');

        expect(result).toBe(false);
      });

      it('should return false for expired session', async () => {
        const expiredDate = new Date();
        expiredDate.setHours(expiredDate.getHours() - 25);
        const expiredSession = {
          ...mockSession,
          started_at: expiredDate.toISOString(),
          ended_at: null,
        };
        const mockBuilder = createMockQueryBuilder({ data: expiredSession, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.validateSession('session-1', 'user-1');

        expect(result).toBe(false);
      });
    });

    describe('invalidateOldSessions', () => {
      it('should invalidate old sessions', async () => {
        const oldSessions = [{ id: 'old-1', started_at: '2024-01-01' }];

        // Mock fetch of old sessions
        const fetchBuilder = createMockQueryBuilder({ data: oldSessions, error: null });
        // Mock update of old sessions
        const updateBuilder = createMockQueryBuilder({ data: null, error: null });

        let callCount = 0;
        vi.mocked(supabase.from).mockImplementation(() => {
          callCount++;
          if (callCount === 1) return fetchBuilder as any;
          return updateBuilder as any;
        });

        const result = await chatHistoryService.invalidateOldSessions('user-1');

        expect(result).toBe(1);
      });

      it('should return 0 when no old sessions', async () => {
        const mockBuilder = createMockQueryBuilder({ data: [], error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.invalidateOldSessions('user-1');

        expect(result).toBe(0);
      });

      it('should return 0 on fetch error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Fetch failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.invalidateOldSessions('user-1');

        expect(result).toBe(0);
      });
    });
  });

  describe('Analytics', () => {
    describe('getUserChatStats', () => {
      it('should return user chat statistics', async () => {
        // Mock for sessions count
        const mockBuilder = createMockQueryBuilder({
          data: null,
          error: null,
          count: 10
        });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getUserChatStats('user-1');

        expect(result).toHaveProperty('totalSessions');
        expect(result).toHaveProperty('totalMessages');
        expect(result).toHaveProperty('totalTitleClicks');
        expect(result).toHaveProperty('averageSessionLength');
        expect(result).toHaveProperty('mostRecommendedTitles');
      });

      it('should return default values on error', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: { message: 'Query failed' } });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        const result = await chatHistoryService.getUserChatStats('user-1');

        expect(result.totalSessions).toBe(0);
        expect(result.totalMessages).toBe(0);
        expect(result.totalTitleClicks).toBe(0);
        expect(result.averageSessionLength).toBe(0);
        expect(result.mostRecommendedTitles).toEqual([]);
      });
    });
  });

  describe('Message Cleanup', () => {
    describe('cleanupOldMessages', () => {
      it('should delete messages older than 24 hours', async () => {
        const mockBuilder = createMockQueryBuilder({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

        await chatHistoryService.cleanupOldMessages('session-1');

        expect(supabase.from).toHaveBeenCalledWith('chat_messages');
        expect(mockBuilder.delete).toHaveBeenCalled();
        expect(mockBuilder.eq).toHaveBeenCalledWith('session_id', 'session-1');
        expect(mockBuilder.lt).toHaveBeenCalled();
      });
    });
  });
});
