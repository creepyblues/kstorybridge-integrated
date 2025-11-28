import { supabase } from '@/integrations/supabase/client';

export interface UXMessaging {
  id: string;
  page_route: string;
  page_name: string;
  account_type: 'buyer' | 'creator' | 'shared';
  title: string;
  subtitle: string | null;
  description: string | null;
  cta_text: string | null;
  empty_state_title: string | null;
  empty_state_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UXMessagingUpdate {
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  cta_text?: string | null;
  empty_state_title?: string | null;
  empty_state_description?: string | null;
}

class UXMessagingService {
  async getAllMessaging(): Promise<UXMessaging[]> {
    const { data, error } = await supabase
      .from('ux_messaging')
      .select('*')
      .order('account_type', { ascending: true })
      .order('page_name', { ascending: true });

    if (error) {
      console.error('Error fetching UX messaging:', error);
      throw new Error(`Failed to fetch UX messaging: ${error.message}`);
    }

    return data || [];
  }

  async getMessagingByRoute(route: string): Promise<UXMessaging | null> {
    const { data, error } = await supabase
      .from('ux_messaging')
      .select('*')
      .eq('page_route', route)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching messaging by route:', error);
      throw new Error(`Failed to fetch messaging: ${error.message}`);
    }

    return data;
  }

  async getMessagingByAccountType(accountType: 'buyer' | 'creator' | 'shared'): Promise<UXMessaging[]> {
    const { data, error } = await supabase
      .from('ux_messaging')
      .select('*')
      .eq('account_type', accountType)
      .order('page_name', { ascending: true });

    if (error) {
      console.error('Error fetching messaging by account type:', error);
      throw new Error(`Failed to fetch messaging: ${error.message}`);
    }

    return data || [];
  }

  async updateMessaging(id: string, updates: UXMessagingUpdate): Promise<UXMessaging> {
    const { data, error } = await supabase
      .from('ux_messaging')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating messaging:', error);
      throw new Error(`Failed to update messaging: ${error.message}`);
    }

    return data;
  }

  async searchMessaging(query: string): Promise<UXMessaging[]> {
    const { data, error } = await supabase
      .from('ux_messaging')
      .select('*')
      .or(`page_name.ilike.%${query}%,page_route.ilike.%${query}%,title.ilike.%${query}%`)
      .order('account_type', { ascending: true })
      .order('page_name', { ascending: true });

    if (error) {
      console.error('Error searching messaging:', error);
      throw new Error(`Failed to search messaging: ${error.message}`);
    }

    return data || [];
  }

  async exportMessaging(): Promise<UXMessaging[]> {
    return this.getAllMessaging();
  }

  async importMessaging(data: Partial<UXMessaging>[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of data) {
      try {
        if (!item.id) {
          failed++;
          continue;
        }

        const updates: UXMessagingUpdate = {};
        if (item.title) updates.title = item.title;
        if (item.subtitle !== undefined) updates.subtitle = item.subtitle;
        if (item.description !== undefined) updates.description = item.description;
        if (item.cta_text !== undefined) updates.cta_text = item.cta_text;
        if (item.empty_state_title !== undefined) updates.empty_state_title = item.empty_state_title;
        if (item.empty_state_description !== undefined) updates.empty_state_description = item.empty_state_description;

        await this.updateMessaging(item.id, updates);
        success++;
      } catch (error) {
        console.error(`Failed to import item ${item.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }
}

export const uxMessagingService = new UXMessagingService();