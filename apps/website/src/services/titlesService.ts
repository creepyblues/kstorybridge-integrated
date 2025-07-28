import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

export type Title = Database['public']['Tables']['titles']['Row'];

export const titlesService = {
  async getTitlesWithPitches(limit: number = 6): Promise<Title[]> {
    const { data, error } = await supabase
      .from('titles')
      .select('*')
      .not('pitch', 'is', null)
      .neq('pitch', '')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch titles with pitches: ${error.message}`);
    }

    return data || [];
  }
};