import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTH_EVENT_NAMES,
  getAuthEventName,
  normalizeFailureReason,
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

test('replaces arbitrary or sensitive failure text with other', () => {
  assert.equal(normalizeFailureReason('auth_rejected'), 'auth_rejected');
  assert.equal(normalizeFailureReason('User person@example.com rejected'), 'other');
});
