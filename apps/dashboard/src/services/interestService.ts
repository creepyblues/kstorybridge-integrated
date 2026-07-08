import { supabase } from '@/lib/supabase';

/**
 * Express Interest: team-mediated buyer interest in a title.
 * Writes go through the express-interest edge function (service role);
 * reads use RLS (buyers see only their own rows, matched by email).
 */
export const interestService = {
  async submitInterest(titleId: string, note?: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('express-interest', {
      body: { title_id: titleId, note },
    });

    if (error) {
      throw new Error('Failed to submit interest. Please try again.');
    }
    if (data && data.success === false) {
      throw new Error(data.error || 'Failed to submit interest');
    }
  },

  async hasExpressedInterest(titleId: string, email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('title_interests')
      .select('id')
      .eq('title_id', titleId)
      .eq('buyer_email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      // Fail-open to the default state: show the button
      return false;
    }
    return !!data;
  },
};
