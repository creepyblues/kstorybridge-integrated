import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBuyerInput,
  validateCreatorInput,
  resolveProfileSource,
  normalizeBuyerRaw,
  classifyInsertError,
  PENDING_BUYER_KEY,
} from './profile-input.ts';

test('buyer input: accepts snake_case and camelCase, strips tags, normalizes url', () => {
  const r = validateBuyerInput({ fullName: ' <b>Jane</b> ', buyer_company: 'ACME', buyerRole: 'producer', linkedin_url: 'linkedin.com/in/jane', newsletterConsent: 'true' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, {
    full_name: 'Jane', buyer_company: 'ACME', buyer_role: 'producer',
    linkedin_url: 'https://linkedin.com/in/jane', newsletter_consent: true, trial_session_id: null,
  });
});

test('buyer input: rejects missing name, bad role, bad url, oversized strings', () => {
  const r = validateBuyerInput({ buyer_role: 'ceo', linkedin_url: 'javascript:alert(1)', buyer_company: 'x'.repeat(201) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.includes('full_name is required'));
  assert.ok(r.errors.includes('buyer_role is invalid'));
  assert.ok(r.errors.includes('linkedin_url is not a valid URL'));
  assert.ok(r.errors.includes('buyer_company too long'));
});

test('buyer input: trial_session_id must be a plain token', () => {
  assert.equal(validateBuyerInput({ full_name: 'A', trial_session_id: 'abc-123_X' }).ok, true);
  assert.equal(validateBuyerInput({ full_name: 'A', trial_session_id: "x' OR 1=1" }).ok, false);
});

test('creator input: requires pen_name and author|agent role', () => {
  assert.equal(validateCreatorInput({ full_name: 'A', pen_name: 'P', ip_owner_role: 'author' }).ok, true);
  const bad = validateCreatorInput({ full_name: 'A', ipOwnerRole: 'illustrator' });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.includes('pen_name is required'));
  assert.ok(bad.errors.includes('ip_owner_role must be author or agent'));
});

test('resolveProfileSource: body wins, then pending metadata, else null; ids in body are ignored by shape', () => {
  const meta = { [PENDING_BUYER_KEY]: { full_name: 'Meta' }, full_name: 'Google Name' };
  assert.deepEqual(resolveProfileSource({ full_name: 'Body' }, meta, PENDING_BUYER_KEY, normalizeBuyerRaw), { source: 'body', raw: { full_name: 'Body' } });
  assert.deepEqual(resolveProfileSource({ user_id: 'evil', email: 'evil@x' }, meta, PENDING_BUYER_KEY, normalizeBuyerRaw), { source: 'metadata', raw: { full_name: 'Meta' } });
  assert.equal(resolveProfileSource({}, { full_name: 'Google Name' }, PENDING_BUYER_KEY, normalizeBuyerRaw), null);
  assert.equal(resolveProfileSource(null, null, PENDING_BUYER_KEY, normalizeBuyerRaw), null);
});

test('classifyInsertError: only the email unique violation is an email conflict', () => {
  assert.equal(classifyInsertError({ code: '23505', message: 'duplicate key value violates unique constraint "user_buyers_email_key"' }, 'user_buyers'), 'email_conflict');
  assert.equal(classifyInsertError({ code: '23505', message: 'duplicate key value violates unique constraint "user_buyers_email_lower_key"' }, 'user_buyers'), 'email_conflict');
  assert.equal(classifyInsertError({ code: '23505', message: 'duplicate key value violates unique constraint "user_buyers_pkey"', details: 'Key (id)=(…) already exists.' }, 'user_buyers'), 'other');
  assert.equal(classifyInsertError({ code: '23502', message: 'null value' }, 'user_buyers'), 'other');
  assert.equal(classifyInsertError(null, 'user_buyers'), null);
});
