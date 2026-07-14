import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getMessageLengthBucket,
  trackChatMessageSent,
  trackCompsSearch,
  trackFavorite,
  trackMandateSearchSubmitted,
  trackPitchDeckOpened,
  trackPitchDeckPageViewed,
  trackTitleDetailView,
  trackTitleSearch,
} from './analytics';

const getEvent = () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  return {
    log,
    expectEvent: (name: string, params: Record<string, unknown>) => {
      expect(log).toHaveBeenCalledWith(`[Analytics] ${name}`, {
        ...params,
        app_section: 'dashboard',
      });
    },
  };
};

describe('buyer engagement analytics contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits title discovery events without query or title text', () => {
    const { expectEvent } = getEvent();

    trackTitleSearch('hybrid', 1);
    expectEvent('title_search_submitted', { search_type: 'hybrid', filter_count: 1 });

    trackTitleDetailView('title-uuid', 'search');
    expectEvent('title_detail_viewed', { title_id: 'title-uuid', source: 'search' });
  });

  it('buckets chat length without emitting chat text or exact length', () => {
    const { expectEvent } = getEvent();

    trackChatMessageSent('suggestion', 72);

    expectEvent('chat_message_sent', {
      input_type: 'suggestion',
      message_length_bucket: '51_100',
    });
  });

  it.each([
    [1, '1_25'],
    [25, '1_25'],
    [26, '26_50'],
    [51, '51_100'],
    [101, '101_250'],
    [251, '251_plus'],
  ] as const)('buckets a %i-character chat input as %s', (length, bucket) => {
    expect(getMessageLengthBucket(length)).toBe(bucket);
  });

  it('emits controlled comps and mandate submission metadata', () => {
    const { expectEvent } = getEvent();

    trackCompsSearch(2, 'comps_navigator');
    expectEvent('comps_search_submitted', { input_count: 2, source: 'comps_navigator' });

    trackMandateSearchSubmitted(0, 'mandates');
    expectEvent('mandate_search_submitted', { filter_count: 0, source: 'mandates' });
  });

  it('uses separate favorite outcome names after persistence succeeds', () => {
    const { expectEvent } = getEvent();

    trackFavorite('add', 'title-uuid', 'title_detail');
    expectEvent('favorite_added', { title_id: 'title-uuid', source: 'title_detail' });

    trackFavorite('remove', 'title-uuid', 'saved_titles');
    expectEvent('favorite_removed', { title_id: 'title-uuid', source: 'saved_titles' });
  });

  it('emits pitch-deck outcomes without names, URLs, or tier labels', () => {
    const { expectEvent } = getEvent();

    trackPitchDeckOpened('title-uuid', 'preview');
    expectEvent('pitch_deck_opened', { title_id: 'title-uuid', access_type: 'preview' });

    trackPitchDeckPageViewed('title-uuid', 2, 'preview');
    expectEvent('pitch_deck_page_viewed', {
      title_id: 'title-uuid',
      page_number: 2,
      access_type: 'preview',
    });
  });
});
