import { describe, expect, it } from 'vitest';
import {
  getEmailCampaignAttribution,
  isAnalyticsCollectionAllowed,
} from './analytics';

describe('isAnalyticsCollectionAllowed', () => {
  it.each(['kstorybridge.com', 'www.kstorybridge.com'])(
    'allows website production host %s',
    hostname => {
      expect(isAnalyticsCollectionAllowed(hostname)).toBe(true);
    }
  );

  it.each([
    'localhost',
    '127.0.0.1',
    'website-staging.kstorybridge.com',
    'kstorybridge-website.vercel.app',
  ])('blocks non-production host %s by default', hostname => {
    expect(isAnalyticsCollectionAllowed(hostname)).toBe(false);
  });

  it('allows an explicit non-production override', () => {
    expect(isAnalyticsCollectionAllowed('localhost', true)).toBe(true);
  });
});

describe('getEmailCampaignAttribution', () => {
  it('recognizes an explicitly tagged email campaign', () => {
    expect(
      getEmailCampaignAttribution(
        '?utm_source=brevo&utm_medium=email&utm_campaign=buyer-weekly'
      )
    ).toEqual({
      campaignSource: 'brevo',
      campaignMedium: 'email',
      campaignName: 'buyer-weekly',
    });
  });

  it('does not classify ordinary referral or paid traffic as email', () => {
    expect(getEmailCampaignAttribution('?utm_source=linkedin&utm_medium=social')).toBeNull();
    expect(getEmailCampaignAttribution('?utm_source=google&utm_medium=cpc')).toBeNull();
  });

  it('does not return recipient identifiers or arbitrary campaign parameters', () => {
    const attribution = getEmailCampaignAttribution(
      '?utm_source=newsletter&utm_medium=email&utm_campaign=July%20Buyers' +
        '&utm_content=person@example.com&contact_id=secret'
    );

    expect(attribution).toEqual({
      campaignSource: 'newsletter',
      campaignMedium: 'email',
      campaignName: 'July_Buyers',
    });
    expect(JSON.stringify(attribution)).not.toContain('example.com');
    expect(JSON.stringify(attribution)).not.toContain('secret');
  });
});
