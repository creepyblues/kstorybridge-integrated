import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  trackError,
  trackExternalLink,
  trackNewsView,
  trackSubscriptionCancel,
} from './analytics';

describe('creator analytics privacy boundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('drops raw errors, URLs, titles, and Stripe subscription identifiers', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    trackError('person@example.com failed at a private URL', 'authentication', 'auth_rejected');
    expect(log).toHaveBeenCalledWith('[Analytics] error', {
      error_location: 'authentication',
      error_code: 'auth_rejected',
      app_section: 'creator',
    });

    trackExternalLink('https://example.com/?recipient=person@example.com', 'Private document');
    expect(log).toHaveBeenCalledWith('[Analytics] external_link_click', {
      event_category: 'outbound',
      app_section: 'creator',
    });

    trackNewsView('post-uuid', 'Confidential Post Title');
    expect(log).toHaveBeenCalledWith('[Analytics] news_view', {
      event_category: 'content_engagement',
      post_id: 'post-uuid',
      app_section: 'creator',
    });

    trackSubscriptionCancel('sub_secret_value');
    expect(log).toHaveBeenCalledWith('[Analytics] subscription_cancel', {
      event_category: 'subscription',
      app_section: 'creator',
    });
  });
});
