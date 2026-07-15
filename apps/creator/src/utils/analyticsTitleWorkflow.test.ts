import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackTitleDraftCreated, trackTitleSubmitted } from './analytics';

describe('creator title-workflow analytics contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['title_draft_created', trackTitleDraftCreated],
    ['title_submitted', trackTitleSubmitted],
  ] as const)('emits %s with only stable workflow metadata', (eventName, track) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    track('draft-uuid', 'quick_add');

    expect(log).toHaveBeenCalledWith(`[Analytics] ${eventName}`, {
      draft_id: 'draft-uuid',
      entry_method: 'quick_add',
      app_section: 'creator',
    });
    const params = log.mock.calls[0][1] as Record<string, unknown>;
    expect(params).not.toHaveProperty('title_name');
    expect(params).not.toHaveProperty('title_url');
    expect(params).not.toHaveProperty('rights_holder_name');
    expect(params).not.toHaveProperty('draft_data');
  });
});
