import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackTitleInterestSubmitted } from './analytics';

describe('buyer interest analytics contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits only the canonical server-confirmed interest outcome fields', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    trackTitleInterestSubmitted('title-uuid');

    expect(log).toHaveBeenCalledWith('[Analytics] interest_submitted', {
      title_id: 'title-uuid',
      source: 'title_detail',
      app_section: 'dashboard',
    });
    const params = log.mock.calls[0][1] as Record<string, unknown>;
    expect(params).not.toHaveProperty('title_name');
    expect(params).not.toHaveProperty('note');
    expect(params).not.toHaveProperty('buyer_email');
  });
});
