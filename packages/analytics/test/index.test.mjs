import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ANALYTICS_EVENT_NAMES,
  AUTH_EVENT_NAMES,
  getAuthEventName,
  normalizeFailureReason,
  sanitizeAnalyticsEventParams,
} from '../dist/index.js';

test('maps every auth stage to a directly queryable event name', () => {
  assert.equal(getAuthEventName('signup', 'viewed'), 'signup_viewed');
  assert.equal(getAuthEventName('signup', 'attempted'), 'signup_attempted');
  assert.equal(getAuthEventName('signup', 'completed'), 'signup_completed');
  assert.equal(getAuthEventName('signup', 'failed'), 'signup_failed');
  assert.equal(getAuthEventName('signin', 'viewed'), 'signin_viewed');
  assert.equal(getAuthEventName('signin', 'attempted'), 'signin_attempted');
  assert.equal(getAuthEventName('signin', 'completed'), 'signin_completed');
  assert.equal(getAuthEventName('signin', 'failed'), 'signin_failed');
});

test('uses the canonical creator profile outcome', () => {
  assert.equal(AUTH_EVENT_NAMES.creatorProfileCompleted, 'creator_profile_completed');
});

test('uses directly queryable creator title workflow outcomes', () => {
  assert.equal(ANALYTICS_EVENT_NAMES.titleDraftCreated, 'title_draft_created');
  assert.equal(ANALYTICS_EVENT_NAMES.titleSubmitted, 'title_submitted');
  assert.equal(ANALYTICS_EVENT_NAMES.titleApproved, 'title_approved');
  assert.equal(ANALYTICS_EVENT_NAMES.titlePublished, 'title_published');
});

test('uses directly queryable website acquisition events', () => {
  assert.equal(ANALYTICS_EVENT_NAMES.audiencePathSelected, 'audience_path_selected');
  assert.equal(ANALYTICS_EVENT_NAMES.featurePromoSelected, 'feature_promo_selected');
  assert.equal(ANALYTICS_EVENT_NAMES.trialCtaClicked, 'trial_cta_clicked');
  assert.equal(ANALYTICS_EVENT_NAMES.signupCtaClicked, 'signup_cta_clicked');
  assert.equal(ANALYTICS_EVENT_NAMES.signinCtaClicked, 'signin_cta_clicked');
  assert.equal(ANALYTICS_EVENT_NAMES.creatorInquiryStarted, 'creator_inquiry_started');
  assert.equal(ANALYTICS_EVENT_NAMES.creatorInquirySubmitted, 'creator_inquiry_submitted');
  assert.equal(ANALYTICS_EVENT_NAMES.creatorInquiryFailed, 'creator_inquiry_failed');
});

test('replaces arbitrary or sensitive failure text with other', () => {
  assert.equal(normalizeFailureReason('auth_rejected'), 'auth_rejected');
  assert.equal(normalizeFailureReason('User person@example.com rejected'), 'other');
});

test('keeps exact canonical primitives and stable identifiers', () => {
  assert.deepEqual(sanitizeAnalyticsEventParams('interest_submitted', {
    app_section: 'dashboard',
    traffic_type: 'external',
    source: 'title_detail',
    title_id: '123e4567-e89b-42d3-a456-426614174000',
    filter_count: 3,
    has_results: true,
  }), {
    app_section: 'dashboard',
    traffic_type: 'external',
    source: 'title_detail',
    title_id: '123e4567-e89b-42d3-a456-426614174000',
    filter_count: 3,
    has_results: true,
  });
});

test('drops sensitive, high-cardinality, structured, and unknown fields', () => {
  assert.deepEqual(sanitizeAnalyticsEventParams('title_detail_view', {
    title_name: 'A Secret Title',
    query: 'private search text',
    search_term: 'private search text',
    suggestion_text: 'private prompt',
    error_message: 'person@example.com failed',
    url: 'https://example.com/?recipient=person@example.com',
    destination_url: 'https://example.com/private',
    event_label: 'arbitrary free text',
    timestamp: '2026-07-13T12:00:00Z',
    user_id: '123e4567-e89b-42d3-a456-426614174000',
    session_id: 'session-secret',
    subscription_id: 'sub_secret',
    fields_updated: ['name', 'company'],
    future_unreviewed_field: 'value',
  }), {});
});

test('removes page query strings and refuses locations on custom events', () => {
  assert.deepEqual(sanitizeAnalyticsEventParams('page_view', {
    page_location: 'https://dashboard.kstorybridge.com/buyers/home?email=person@example.com#private',
    page_path: '/buyers/home?recipient=abc#private',
    page_title: 'Private title name',
  }), {
    page_location: 'https://dashboard.kstorybridge.com/buyers/home',
    page_path: '/buyers/home',
  });
  assert.deepEqual(sanitizeAnalyticsEventParams('external_link_click', {
    page_location: 'https://example.com/private',
  }), {});
  assert.deepEqual(sanitizeAnalyticsEventParams('page_view', {
    page_path: '/users/person%40example.com',
  }), {});
});

test('rejects malformed controlled values and identifiers', () => {
  assert.deepEqual(sanitizeAnalyticsEventParams('test_event', {
    source: 'contains arbitrary words',
    source_tool: 'person@example.com',
    feature_name: 'https://example.com/private',
    title_id: 'contains arbitrary words',
    currency: 'usd',
    result_count: Number.NaN,
  }), {});
});
