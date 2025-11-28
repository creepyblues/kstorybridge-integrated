import { describe, test, expect } from 'vitest';
import {
  validatePassword,
  validateBuyerForm,
  validateCreatorForm,
  validateBuyerRole,
  validateCreatorRole,
  normalizeCreatorRole,
  isBlockedEmail
} from '../validation';
import type { BuyerFormData, CreatorFormData } from '../types';

describe('Password Validation', () => {
  test('rejects password less than 6 characters', () => {
    expect(validatePassword('Ab1!')).toBe('Password must be at least 6 characters long');
  });

  test('rejects password without lowercase letter', () => {
    expect(validatePassword('ABCDEF1!')).toBe('Password must contain at least one lowercase letter');
  });

  test('rejects password without uppercase letter', () => {
    expect(validatePassword('abcdef1!')).toBe('Password must contain at least one uppercase letter');
  });

  test('rejects password without number', () => {
    expect(validatePassword('Abcdef!')).toBe('Password must contain at least one number');
  });

  test('rejects password without special character', () => {
    expect(validatePassword('Abcdef1')).toBe('Password must contain at least one special character');
  });

  test('accepts valid password', () => {
    expect(validatePassword('Password1!')).toBeNull();
    expect(validatePassword('MyP@ss123')).toBeNull();
    expect(validatePassword('Secure#99')).toBeNull();
  });
});

describe('Buyer Form Validation', () => {
  const validBuyerForm: BuyerFormData = {
    email: 'buyer@example.com',
    password: 'Password1!',
    full_name: 'John Doe',
    buyer_company: 'Acme Corp',
    buyer_role: 'producer',
    linkedin_url: '',
    tier: 'basic'
  };

  test('accepts valid buyer form', () => {
    expect(validateBuyerForm(validBuyerForm)).toBeNull();
  });

  test('rejects empty email', () => {
    const form = { ...validBuyerForm, email: '' };
    expect(validateBuyerForm(form)).toBe('Email is required');
  });

  test('rejects empty password', () => {
    const form = { ...validBuyerForm, password: '' };
    expect(validateBuyerForm(form)).toBe('Password is required');
  });

  test('rejects empty full name', () => {
    const form = { ...validBuyerForm, full_name: '' };
    expect(validateBuyerForm(form)).toBe('Full name is required');
  });

  test('rejects empty company', () => {
    const form = { ...validBuyerForm, buyer_company: '' };
    expect(validateBuyerForm(form)).toBe('Company is required');
  });

  test('rejects empty role', () => {
    const form = { ...validBuyerForm, buyer_role: '' };
    expect(validateBuyerForm(form)).toBe('Role is required');
  });

  test('rejects invalid email format', () => {
    const form = { ...validBuyerForm, email: 'invalid-email' };
    expect(validateBuyerForm(form)).toBe('Please enter a valid email address');
  });

  test('rejects invalid password', () => {
    const form = { ...validBuyerForm, password: 'weak' };
    expect(validateBuyerForm(form)).toBe('Password must be at least 6 characters long');
  });

  test('accepts form with optional linkedin_url', () => {
    const form = { ...validBuyerForm, linkedin_url: 'https://linkedin.com/in/johndoe' };
    expect(validateBuyerForm(form)).toBeNull();
  });
});

describe('Creator Form Validation', () => {
  const validCreatorForm: CreatorFormData = {
    email: 'creator@example.com',
    password: 'Password1!',
    full_name: 'Jane Smith',
    pen_name: 'J.S. Writer',
    ip_owner_role: 'author',
    ip_owner_company: '',
    website_url: '',
    invitation_status: 'invited'
  };

  test('accepts valid creator form', () => {
    expect(validateCreatorForm(validCreatorForm)).toBeNull();
  });

  test('rejects empty email', () => {
    const form = { ...validCreatorForm, email: '' };
    expect(validateCreatorForm(form)).toBe('Email is required');
  });

  test('rejects empty password', () => {
    const form = { ...validCreatorForm, password: '' };
    expect(validateCreatorForm(form)).toBe('Password is required');
  });

  test('rejects empty full name', () => {
    const form = { ...validCreatorForm, full_name: '' };
    expect(validateCreatorForm(form)).toBe('Full name is required');
  });

  test('rejects empty pen name', () => {
    const form = { ...validCreatorForm, pen_name: '' };
    expect(validateCreatorForm(form)).toBe('Pen name is required');
  });

  test('rejects missing role', () => {
    const form = { ...validCreatorForm, ip_owner_role: '' as any };
    expect(validateCreatorForm(form)).toBe('Role is required');
  });

  test('rejects invalid email format', () => {
    const form = { ...validCreatorForm, email: 'invalid-email' };
    expect(validateCreatorForm(form)).toBe('Please enter a valid email address');
  });
});

describe('Buyer Role Validation', () => {
  test('accepts valid roles', () => {
    expect(validateBuyerRole('producer')).toBeNull();
    expect(validateBuyerRole('executive')).toBeNull();
    expect(validateBuyerRole('agent')).toBeNull();
    expect(validateBuyerRole('content_scout')).toBeNull();
    expect(validateBuyerRole('other')).toBeNull();
  });

  test('rejects invalid role', () => {
    expect(validateBuyerRole('invalid_role')).toBe('Please select a valid role');
  });
});

describe('Creator Role Validation', () => {
  test('accepts valid roles', () => {
    expect(validateCreatorRole('author')).toBeNull();
    expect(validateCreatorRole('agent')).toBeNull();
  });

  test('rejects empty role', () => {
    expect(validateCreatorRole('')).toBe('Please select a role');
    expect(validateCreatorRole('  ')).toBe('Please select a role');
  });
});

describe('Normalize Creator Role', () => {
  test('normalizes valid roles', () => {
    expect(normalizeCreatorRole('author')).toBe('author');
    expect(normalizeCreatorRole('agent')).toBe('agent');
    expect(normalizeCreatorRole('AUTHOR')).toBe('author');
    expect(normalizeCreatorRole('AGENT')).toBe('agent');
  });

  test('defaults to author for invalid/null roles', () => {
    expect(normalizeCreatorRole(null)).toBe('author');
    expect(normalizeCreatorRole(undefined)).toBe('author');
    expect(normalizeCreatorRole('invalid')).toBe('author');
  });
});

describe('Email Blocking', () => {
  test('blocks internal domains', () => {
    expect(isBlockedEmail('test@dadble.com')).toBe(true);
    expect(isBlockedEmail('user@sandstoneartists.com')).toBe(true);
  });

  test('allows other domains', () => {
    expect(isBlockedEmail('user@example.com')).toBe(false);
    expect(isBlockedEmail('test@gmail.com')).toBe(false);
  });

  test('is case insensitive', () => {
    expect(isBlockedEmail('TEST@DADBLE.COM')).toBe(true);
    expect(isBlockedEmail('User@SandstoneArtists.com')).toBe(true);
  });
});
