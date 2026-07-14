import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { interestService } from './interestService';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}));

describe('interestService.submitInterest', () => {
  const invoke = vi.mocked(supabase.functions.invoke);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true only when the server created a new interest outcome', async () => {
    invoke.mockResolvedValue({ data: { success: true, created: true }, error: null });

    await expect(interestService.submitInterest('title-1')).resolves.toBe(true);
    expect(invoke).toHaveBeenCalledWith('express-interest', {
      body: { title_id: 'title-1', note: undefined },
    });
  });

  it('returns false when the server refreshed a duplicate interest', async () => {
    invoke.mockResolvedValue({ data: { success: true, created: false }, error: null });

    await expect(interestService.submitInterest('title-1', 'updated note')).resolves.toBe(false);
  });

  it('remains compatible with the prior successful response during deployment ordering', async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null });

    await expect(interestService.submitInterest('title-1')).resolves.toBe(true);
  });
});
