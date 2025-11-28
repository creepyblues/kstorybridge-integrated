/**
 * Email Signup Tests
 *
 * Tests for email-based signup flows (buyer and creator) using edge functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBuyerViaEdgeFunction, createCreatorViaEdgeFunction } from '@/services/emailSignupEdgeFunction';

// Mock fetch globally
global.fetch = vi.fn();

describe('Email Signup Edge Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock before each test
    (global.fetch as any).mockReset();
  });

  describe('createBuyerViaEdgeFunction', () => {
    it('should successfully create buyer profile', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Buyer profile created successfully',
          profile: {
            id: 'test-user-id',
            email: 'buyer@company.com',
            full_name: 'Test Buyer',
            buyer_company: 'Test Company',
            buyer_role: 'producer',
            tier: 'basic'
          }
        })
      });

      const result = await createBuyerViaEdgeFunction({
        id: 'test-user-id',
        email: 'buyer@company.com',
        full_name: 'Test Buyer',
        buyer_company: 'Test Company',
        buyer_role: 'producer',
        tier: 'basic',
        requested: false
      });

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle edge function errors', async () => {
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing required fields'
        })
      });

      const result = await createBuyerViaEdgeFunction({
        id: 'test-user-id',
        email: 'buyer@company.com',
        full_name: 'Test Buyer',
        buyer_company: 'Test Company',
        buyer_role: 'producer'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await createBuyerViaEdgeFunction({
        id: 'test-user-id',
        email: 'buyer@company.com',
        full_name: 'Test Buyer',
        buyer_company: 'Test Company',
        buyer_role: 'producer'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should include all required fields in request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, profile: {} })
      });

      await createBuyerViaEdgeFunction({
        id: 'test-user-id',
        email: 'buyer@company.com',
        full_name: 'Test Buyer',
        buyer_company: 'Test Company',
        buyer_role: 'producer',
        linkedin_url: 'https://linkedin.com/in/test',
        tier: 'pro'
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toMatchObject({
        userId: 'test-user-id',
        email: 'buyer@company.com',
        fullName: 'Test Buyer',
        buyerCompany: 'Test Company',
        buyerRole: 'producer',
        linkedinUrl: 'https://linkedin.com/in/test',
        tier: 'pro'
      });
    });
  });

  describe('createCreatorViaEdgeFunction', () => {
    it('should successfully create creator profile', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Creator profile created successfully',
          profile: {
            id: 'test-user-id',
            email: 'creator@example.com',
            full_name: 'Test Creator',
            pen_name: 'Test Pen Name',
            ip_owner_role: 'author'
          }
        })
      });

      const result = await createCreatorViaEdgeFunction({
        id: 'test-user-id',
        email: 'creator@example.com',
        full_name: 'Test Creator',
        pen_name: 'Test Pen Name',
        ip_owner_role: 'author'
      });

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle edge function errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid role'
        })
      });

      const result = await createCreatorViaEdgeFunction({
        id: 'test-user-id',
        email: 'creator@example.com',
        full_name: 'Test Creator',
        pen_name: 'Test Pen Name',
        ip_owner_role: 'invalid'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid role');
    });

    it('should include optional fields in request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, profile: {} })
      });

      await createCreatorViaEdgeFunction({
        id: 'test-user-id',
        email: 'creator@example.com',
        full_name: 'Test Creator',
        pen_name: 'Test Pen Name',
        ip_owner_role: 'author',
        ip_owner_company: 'Test Publishing',
        website_url: 'https://example.com'
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toMatchObject({
        userId: 'test-user-id',
        email: 'creator@example.com',
        fullName: 'Test Creator',
        penName: 'Test Pen Name',
        ipOwnerRole: 'author',
        ipOwnerCompany: 'Test Publishing',
        websiteUrl: 'https://example.com'
      });
    });
  });

  describe('Edge Function Configuration', () => {
    it('should use correct endpoint for buyer signup', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, profile: {} })
      });

      await createBuyerViaEdgeFunction({
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test',
        buyer_company: 'Company',
        buyer_role: 'producer'
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain('/functions/v1/create-buyer-profile');
    });

    it('should use correct endpoint for creator signup', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, profile: {} })
      });

      await createCreatorViaEdgeFunction({
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test',
        pen_name: 'Test Pen'
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain('/functions/v1/create-creator-profile');
    });

    it('should include anon key in headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, profile: {} })
      });

      await createBuyerViaEdgeFunction({
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test',
        buyer_company: 'Company',
        buyer_role: 'producer'
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers).toHaveProperty('apikey');
      expect(headers).toHaveProperty('Authorization');
      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });
  });
});
