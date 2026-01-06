import { supabase } from "@/lib/supabase";

export type DraftStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type TitleDraft = {
  id: string;
  creator_id: string;
  draft_data: any;
  current_step: number;
  status: DraftStatus;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
};

export type DraftWithCreator = TitleDraft & {
  user_creators?: {
    full_name: string;
    email: string;
    pen_name: string;
  };
};

/**
 * Helper function to attach creator info to drafts
 * Fetches creator info separately and joins in memory
 */
async function attachCreatorInfo(drafts: TitleDraft[]): Promise<DraftWithCreator[]> {
  if (!drafts || drafts.length === 0) {
    return [];
  }

  // Get unique creator IDs
  const creatorIds = [...new Set(drafts.map(d => d.creator_id))];

  // Batch fetch creator info
  const { data: creators, error: creatorError } = await supabase
    .from('user_creators')
    .select('id, full_name, email, pen_name')
    .in('id', creatorIds);

  if (creatorError) {
    console.warn('Failed to fetch creator info:', creatorError);
    // Return drafts without creator info rather than failing
    return drafts.map(draft => ({ ...draft, user_creators: undefined }));
  }

  // Create lookup map for efficient joining
  const creatorMap = new Map(
    creators?.map(c => [c.id, { full_name: c.full_name, email: c.email, pen_name: c.pen_name }]) || []
  );

  // Join in memory
  return drafts.map(draft => ({
    ...draft,
    user_creators: creatorMap.get(draft.creator_id)
  }));
}

export const draftService = {
  /**
   * Get all submitted drafts for admin review
   */
  async getAllSubmittedDrafts(): Promise<DraftWithCreator[]> {
    const { data, error } = await supabase
      .from('title_drafts')
      .select('*')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch submitted drafts: ${error.message}`);
    }

    // Fetch and attach creator info
    return await attachCreatorInfo(data || []);
  },

  /**
   * Get all drafts with any status (for admin overview)
   */
  async getAllDrafts(status?: DraftStatus): Promise<DraftWithCreator[]> {
    let query = supabase
      .from('title_drafts')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    console.log('📊 getAllDrafts query result:', {
      status,
      dataCount: data?.length,
      error: error?.message,
      data: data
    });

    if (error) {
      console.error('❌ Failed to fetch drafts:', error);

      // Check if this is an RLS permission issue
      if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) {
        console.error('❌ RLS Policy Error: Admin may not have permission to view drafts');
        throw new Error('Permission denied: Admin access not configured. Please apply the admin RLS policy migration.');
      }

      throw new Error(`Failed to fetch drafts: ${error.message}`);
    }

    // Warn if query returned no results (may indicate RLS blocking or genuinely empty table)
    if (!data || data.length === 0) {
      console.warn('⚠️ Query returned 0 drafts. This may indicate:');
      console.warn('  1. RLS policy blocking admin access (check migration 20251104120000)');
      console.warn('  2. No drafts exist in the database');
      console.warn('  3. All drafts filtered out by status filter');
    }

    // Fetch and attach creator info
    const result = await attachCreatorInfo(data || []);
    console.log('📊 After attaching creator info:', { resultCount: result.length });
    return result;
  },

  /**
   * Get a single draft by ID with creator info
   */
  async getDraftById(draftId: string): Promise<DraftWithCreator | null> {
    const { data, error } = await supabase
      .from('title_drafts')
      .select('*')
      .eq('id', draftId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch draft: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Fetch and attach creator info for single draft
    const draftsWithCreator = await attachCreatorInfo([data]);
    return draftsWithCreator[0] || null;
  },

  /**
   * Approve a draft and add it to the titles table
   * Uses edge function to bypass RLS and ensure atomic operation
   * @param draftId - The draft ID to approve
   * @param adminUserId - The admin's user ID (UUID)
   * @returns The new title ID if successful
   */
  async approveDraft(
    draftId: string,
    adminUserId: string
  ): Promise<{ titleId: string }> {
    console.log('[draftService] Approving draft via edge function:', { draftId, adminUserId });

    const { data, error } = await supabase.functions.invoke('approve-title', {
      body: { draftId, adminUserId }
    });

    if (error) {
      console.error('[draftService] Edge function error:', error);
      throw new Error(`Failed to approve draft: ${error.message}`);
    }

    if (!data?.success) {
      const errorMessage = data?.error || 'Unknown error occurred';
      console.error('[draftService] Approval failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('[draftService] Draft approved successfully:', {
      draftId,
      titleId: data.titleId
    });

    return { titleId: data.titleId };
  },

  /**
   * Reject a draft with a reason
   * @param draftId - The draft ID to reject
   * @param adminUserId - The admin's user ID (UUID)
   * @param reason - Rejection reason (required)
   */
  async rejectDraft(
    draftId: string,
    adminUserId: string,
    reason: string
  ): Promise<void> {
    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    const { error } = await supabase
      .from('title_drafts')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        approved_by: adminUserId,
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', draftId)
      .eq('status', 'submitted'); // Only reject submitted drafts

    if (error) {
      throw new Error(`Failed to reject draft: ${error.message}`);
    }

    // Fire-and-forget notification to creator (non-blocking)
    this.notifyCreatorDecision(draftId, 'rejected', reason).catch(err => {
      console.warn('[draftService] Creator rejection notification failed (non-blocking):', err);
    });
  },

  /**
   * Send notification to creator about approval/rejection decision
   * Fire-and-forget pattern - failures do not block the approval flow
   */
  async notifyCreatorDecision(
    draftId: string,
    decision: 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<void> {
    const { error } = await supabase.functions.invoke('notify-title-decision', {
      body: { draftId, decision, rejectionReason }
    });

    if (error) {
      console.error('[draftService] Notification error:', error);
      throw error;
    }
  },

  /**
   * Get draft statistics for admin dashboard
   */
  async getDraftStats(): Promise<{
    total: number;
    submitted: number;
    approved: number;
    rejected: number;
    draft: number;
  }> {
    const { data, error } = await supabase
      .from('title_drafts')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch draft stats: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      draft: 0
    };

    data?.forEach(item => {
      if (item.status === 'submitted') stats.submitted++;
      else if (item.status === 'approved') stats.approved++;
      else if (item.status === 'rejected') stats.rejected++;
      else if (item.status === 'draft') stats.draft++;
    });

    return stats;
  }
};
