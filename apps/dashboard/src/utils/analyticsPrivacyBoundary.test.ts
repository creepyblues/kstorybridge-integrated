import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  trackChatSearch,
  trackChatTitleClick,
  trackPitchDeckError,
  trackSearchQuerySubmitted,
} from './analytics';

describe('dashboard analytics privacy boundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('drops title names, search text, raw errors, timestamps, and unknown fields', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    trackChatSearch('private person@example.com query', 2, 'discovery');
    expect(log).toHaveBeenCalledWith('[Analytics] chat_search', {
      query_length: 32,
      result_count: 2,
      chat_mode: 'discovery',
      app_section: 'dashboard',
    });

    trackChatTitleClick('title-uuid', 'Confidential Working Title', 1);
    expect(log).toHaveBeenCalledWith('[Analytics] chat_title_click', {
      title_id: 'title-uuid',
      position: 1,
      app_section: 'dashboard',
    });

    trackPitchDeckError('title-uuid', 'person@example.com cannot open private URL', 'suite');
    expect(log).toHaveBeenCalledWith('[Analytics] pitch_deck_error', {
      title_id: 'title-uuid',
      user_tier: 'suite',
      app_section: 'dashboard',
    });

    trackSearchQuerySubmitted('private buyer mandate', 0, 'title_search');
    expect(log).toHaveBeenCalledWith('[Analytics] search_query_submitted', {
      query_length: 21,
      result_count: 0,
      search_type: 'title_search',
      has_results: false,
      app_section: 'dashboard',
    });
  });
});
